import React, { useState, useRef, useEffect } from 'react';
import './Magnifier.css';

const Magnifier = ({ src, width, height, zoom = 1.3 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const magnifierRef = useRef(null);
  const imageRef = useRef(null);

  // Get natural image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.src = src;
  }, [src]);

  const handleMouseDown = (e) => {
    // Проверяем, что нажата средняя кнопка мыши (button === 1)
    if (e.button !== 1) return;
    
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Проверяем, находится ли курсор внутри изображения
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      // Переключаем состояние видимости лупы
      if (!isVisible) {
        setPosition({ x, y });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsVisible(false);
  };

  // Calculate background position based on image dimensions and zoom
  const calculateBackgroundPosition = () => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) return { x: 0, y: 0 };
    
    // Calculate ratios between displayed and natural dimensions
    const widthRatio = imageDimensions.width / width;
    const heightRatio = imageDimensions.height / height;
    
    // Calculate background position
    // Adjust for the lens centering with translate(-50%, -50%)
    const bgX = (position.x * widthRatio) * zoom - 100;
    const bgY = (position.y * heightRatio) * zoom - 100;
    
    return { x: bgX, y: bgY };
  };

  const backgroundPosition = calculateBackgroundPosition();


  return (
    <div className="magnifier-container">
      <img
        ref={imageRef}
        src={src}
        alt="Изображение с возможностью увеличения"
        className="magnifier-image"
        onMouseDown={handleMouseDown}
        style={{ width, height }}
      />
      
      {isVisible && imageDimensions.width > 0 && imageDimensions.height > 0 && (
        <div
          ref={magnifierRef}
          className="magnifier-lens"
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: '100px',
            height: '100px',
            backgroundImage: `url(${src})`,
            backgroundSize: `${imageDimensions.width * zoom}px ${imageDimensions.height * zoom}px`,
            backgroundPosition: `-${backgroundPosition.x}px -${backgroundPosition.y}px`,
            border: '2px solid #000',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
    </div>
  );
};

export default Magnifier;