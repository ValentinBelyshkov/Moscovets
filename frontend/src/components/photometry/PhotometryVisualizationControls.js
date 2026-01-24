import React from 'react';
import './PhotometryModule.css';

const PhotometryVisualizationControls = ({
  photometryData,
  showPlanes,
  setShowPlanes,
  showAngles,
  setShowAngles
}) => {
  return (
    <div className="visualization-controls">
      <h4>Настройки визуализации</h4>
      
      {/* Visualization controls for frontal projection */}
      {photometryData.projectionType === 'frontal' && (
        <div className="control-group">
          <h5>Линии</h5>
          <div className="control-buttons">
            <button
              onClick={() => setShowPlanes(prev => ({
                midline: true,
                pupilLine: true,
                occlusalLine: true,
                eLine: true
              }))}
              className="select-all-btn"
            >
              Выбрать все линии
            </button>
            <button
              onClick={() => setShowPlanes(prev => ({
                midline: false,
                pupilLine: false,
                occlusalLine: false,
                eLine: false
              }))}
              className="deselect-all-btn"
            >
              Убрать все линии
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={showPlanes.midline}
              onChange={(e) => setShowPlanes(prev => ({ ...prev, midline: e.target.checked }))}
            />
            Срединная линия лица (n-gn)
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPlanes.pupilLine}
              onChange={(e) => setShowPlanes(prev => ({ ...prev, pupilLine: e.target.checked }))}
            />
            Зрачковая линия (n-sn)
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPlanes.occlusalLine}
              onChange={(e) => setShowPlanes(prev => ({ ...prev, occlusalLine: e.target.checked }))}
            />
            Окклюзионная линия (sn-pg)
          </label>
        </div>
      )}
      
      {photometryData.projectionType === 'frontal' && (
        <div className="control-group">
          <h5>Углы</h5>
          <div className="control-buttons">
            <button
              onClick={() => setShowAngles(prev => ({
                nasolabial: true,
                facialProfile: true
              }))}
              className="select-all-btn"
            >
              Выбрать все углы
            </button>
            <button
              onClick={() => setShowAngles(prev => ({
                nasolabial: false,
                facialProfile: false
              }))}
              className="deselect-all-btn"
            >
              Убрать все углы
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={showAngles.facialProfile}
              onChange={(e) => setShowAngles(prev => ({ ...prev, facialProfile: e.target.checked }))}
            />
            Угол профиля лица (n-sn-pg)
          </label>
        </div>
      )}
      
      {/* Visualization controls for profile projection */}
      {photometryData.projectionType === 'profile' && (
        <div className="control-group">
          <h5>Линии</h5>
          <div className="control-buttons">
            <button
              onClick={() => setShowPlanes(prev => ({
                midline: true,
                pupilLine: true,
                occlusalLine: true,
                eLine: true
              }))}
              className="select-all-btn"
            >
              Выбрать все линии
            </button>
            <button
              onClick={() => setShowPlanes(prev => ({
                midline: false,
                pupilLine: false,
                occlusalLine: false,
                eLine: false
              }))}
              className="deselect-all-btn"
            >
              Убрать все линии
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={showPlanes.eLine}
              onChange={(e) => setShowPlanes(prev => ({ ...prev, eLine: e.target.checked }))}
            />
            E-line (pro-pog)
          </label>
        </div>
      )}
      
      {photometryData.projectionType === 'profile' && (
        <div className="control-group">
          <h5>Углы</h5>
          <div className="control-buttons">
            <button
              onClick={() => setShowAngles(prev => ({
                nasolabial: true,
                facialProfile: true
              }))}
              className="select-all-btn"
            >
              Выбрать все углы
            </button>
            <button
              onClick={() => setShowAngles(prev => ({
                nasolabial: false,
                facialProfile: false
              }))}
              className="deselect-all-btn"
            >
              Убрать все углы
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={showAngles.nasolabial}
              onChange={(e) => setShowAngles(prev => ({ ...prev, nasolabial: e.target.checked }))}
            />
            Носогубный угол (sn-ls-coll)
          </label>
          <label>
            <input
              type="checkbox"
              checked={showAngles.facialProfile}
              onChange={(e) => setShowAngles(prev => ({ ...prev, facialProfile: e.target.checked }))}
            />
            Угол профиля лица (n-sn-pg)
          </label>
        </div>
      )}
    </div>
  );
};

export default PhotometryVisualizationControls;