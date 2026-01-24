import React, { useEffect, useRef } from 'react';
import { drawAllElements } from './canvasUtils';

const CephalometryCanvas = ({
  state,
  handlers,
  imageInfoRef
}) => {
  const {
    cephalometryData,
    imagesUploaded,
    activeTool,
    selectedPoint,
    isMagnifierActive,
    magnifierPosition,
    magnifierZoom,
    canvasRef,
    containerRef
  } = state;

  const {
    handleCanvasClick,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCanvasMouseLeave
  } = handlers;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesUploaded || !cephalometryData.images[cephalometryData.projectionType]) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x, y, scale, imgWidth, imgHeight } = imageInfoRef.current;
      drawAllElements(ctx, state, { img, imageX: x, imageY: y, scale, imgWidth, imgHeight });
    };
    img.src = cephalometryData.images[cephalometryData.projectionType];
  }, [cephalometryData, imagesUploaded, state, canvasRef, imageInfoRef]);

  return (
    <div className="image-container flex-grow relative overflow-hidden bg-gray-100 rounded border">
      <div className="canvas-container w-full h-full" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        />
        
        {isMagnifierActive && (
          <div
            className="magnifier-glass absolute rounded-full border-2 border-black pointer-events-none z-50 shadow-lg overflow-hidden"
            style={{
              left: magnifierPosition.x,
              top: magnifierPosition.y,
              width: '120px',
              height: '120px',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Magnifier content would go here, possibly another canvas or zoomed div */}
            <div className="bg-white w-full h-full flex items-center justify-center text-[10px]">
              Zoom: {magnifierZoom}x
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CephalometryCanvas;
