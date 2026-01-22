"""
Эндпоинты для работы с сессиями моделирования
"""
from typing import Any, List, Optional
import os
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.models.modeling import ModelType, ModelFormat, ModelingStatus
from app.services.assimp_service import assimp_service
from app.crud.crud_modeling import generate_model_file_path
from app.api.v1.endpoints.model_helpers import validate_model_exists

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/sessions", response_model=schemas.ModelingSession)
def create_modeling_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: schemas.ModelingSessionCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Создание сессии моделирования"""
    session = crud.modeling_session.create_with_models(db=db, obj_in=session_in)
    return session


@router.get("/sessions", response_model=List[schemas.ModelingSession])
def read_modeling_sessions(
    db: Session = Depends(deps.get_db),
    patient_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Получение списка сессий моделирования"""
    if patient_id:
        sessions = crud.modeling_session.get_by_patient(db, patient_id=patient_id, skip=skip, limit=limit)
    else:
        sessions = crud.modeling_session.get_multi(db, skip=skip, limit=limit)
    
    return sessions


@router.get("/sessions/{session_id}", response_model=schemas.ModelingSessionWithModels)
def read_modeling_session(
    *,
    db: Session = Depends(deps.get_db),
    session_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Получение сессии моделирования с моделями"""
    session = crud.modeling_session.get_with_models(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    return session


@router.post("/sessions/{session_id}/add-model")
def add_model_to_session(
    *,
    db: Session = Depends(deps.get_db),
    session_id: int,
    model_type: ModelType,
    model_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Добавление модели в сессию моделирования"""
    session = validate_model_exists(db, crud.modeling_session, session_id, "Modeling session")
    model = validate_model_exists(db, crud.three_d_model, model_id, "3D model")
    
    updated_session = crud.modeling_session.add_model_to_session(
        db, session_id=session_id, model_type=model_type.value, model_id=model_id
    )
    
    return {"message": f"Model {model_type.value} added to session successfully"}


@router.post("/assemble-models", response_model=schemas.ModelAssemblyResponse)
async def assemble_models(
    *,
    db: Session = Depends(deps.get_db),
    assembly_request: schemas.ModelAssemblyRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Сборка 3D моделей"""
    session = crud.modeling_session.get_with_models(db, session_id=assembly_request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    if not session.upper_jaw or not session.lower_jaw:
        raise HTTPException(status_code=400, detail="Both upper and lower jaw models are required for assembly")
    
    try:
        assembly_parameters = {
            'auto_align': assembly_request.auto_align,
            'tolerance': assembly_request.tolerance,
            'upper_jaw_position': {
                'x': session.upper_jaw.position_x,
                'y': session.upper_jaw.position_y,
                'z': session.upper_jaw.position_z
            },
            'lower_jaw_position': {
                'x': session.lower_jaw.position_x,
                'y': session.lower_jaw.position_y,
                'z': session.lower_jaw.position_z
            }
        }
        
        crud.modeling_session.update_session_parameters(
            db, db_obj=session, parameters={
                'status': ModelingStatus.ASSEMBLED,
                'modeling_parameters': assembly_parameters
            }
        )
        
        return schemas.ModelAssemblyResponse(
            success=True,
            message="Models assembled successfully",
            assembly_parameters=assembly_parameters
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error assembling models: {str(e)}")


@router.post("/create-occlusion-pad", response_model=schemas.OcclusionPadResponse)
async def create_occlusion_pad(
    *,
    db: Session = Depends(deps.get_db),
    pad_request: schemas.OcclusionPadRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Создание окклюзионной накладки"""
    session = crud.modeling_session.get_with_models(db, session_id=pad_request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    if not session.upper_jaw or not session.lower_jaw:
        raise HTTPException(status_code=400, detail="Both upper and lower jaw models are required for occlusion pad creation")
    
    if session.status != ModelingStatus.ASSEMBLED:
        raise HTTPException(status_code=400, detail="Models must be assembled before creating occlusion pad")
    
    try:
        output_path = generate_model_file_path("occlusion_pad.stl", "occlusion_pad")
        
        parameters = {
            'pad_thickness': pad_request.pad_thickness,
            'margin_offset': pad_request.margin_offset,
            'cement_gap': pad_request.cement_gap
        }
        
        success = assimp_service.create_occlusion_pad(
            session.upper_jaw.file_path,
            session.lower_jaw.file_path,
            output_path,
            parameters
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to create occlusion pad")
        
        pad_metadata = assimp_service.load_model(output_path)
        
        pad_model_in = schemas.ThreeDModelCreate(
            patient_id=session.patient_id,
            model_type=ModelType.OCCLUSION_PAD,
            model_format=ModelFormat.STL,
            file_path=output_path,
            original_filename=f"occlusion_pad_session_{session.id}.stl",
            file_size=os.path.getsize(output_path),
            vertices_count=pad_metadata.get('vertices_count'),
            faces_count=pad_metadata.get('faces_count'),
            bounding_box=pad_metadata.get('bounding_box')
        )
        
        with open(output_path, "rb") as f:
            pad_file_content = f.read()
        
        pad_model = crud.three_d_model.create_with_file(db=db, obj_in=pad_model_in, file_content=pad_file_content)
        
        crud.modeling_session.update_session_parameters(
            db, db_obj=session, parameters={
                'status': ModelingStatus.PAD_CREATED,
                'occlusion_pad_id': pad_model.id
            }
        )
        
        return schemas.OcclusionPadResponse(
            success=True,
            message="Occlusion pad created successfully",
            pad_model_id=pad_model.id,
            pad_parameters=parameters
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating occlusion pad: {str(e)}")


@router.post("/export-model", response_model=schemas.ModelExportResponse)
async def export_model(
    *,
    db: Session = Depends(deps.get_db),
    export_request: schemas.ModelExportRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Экспорт 3D модели"""
    session = crud.modeling_session.get_with_models(db, session_id=export_request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Modeling session not found")
    
    model = None
    if export_request.model_type == ModelType.UPPER_JAW:
        model = session.upper_jaw
    elif export_request.model_type == ModelType.LOWER_JAW:
        model = session.lower_jaw
    elif export_request.model_type == ModelType.BITE_1:
        model = session.bite1
    elif export_request.model_type == ModelType.BITE_2:
        model = session.bite2
    elif export_request.model_type == ModelType.OCCLUSION_PAD:
        model = session.occlusion_pad
    
    if not model:
        raise HTTPException(status_code=404, detail="Requested model not found in session")
    
    if not os.path.exists(model.file_path):
        raise HTTPException(status_code=404, detail="Model file not found on disk")
    
    try:
        export_filename = f"{export_request.model_type.value}_export.{export_request.export_format.value}"
        export_path = generate_model_file_path(export_filename, "export")
        
        success = assimp_service.convert_format(
            model.file_path,
            export_path,
            export_request.export_format.value
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to export model")
        
        if export_request.model_type == ModelType.OCCLUSION_PAD:
            crud.modeling_session.update_session_parameters(
                db, db_obj=session, parameters={'status': ModelingStatus.EXPORTED}
            )
        
        file_size = os.path.getsize(export_path)
        
        return schemas.ModelExportResponse(
            success=True,
            message="Model exported successfully",
            download_url=f"/api/v1/modeling/download-export/{export_path.split('/')[-1]}",
            file_size=file_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error exporting model: {str(e)}")


@router.get("/download-export/{filename}")
async def download_exported_model(
    filename: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Скачивание экспортированной модели"""
    file_path = f"uploads/3d_models/export/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Exported file not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )
