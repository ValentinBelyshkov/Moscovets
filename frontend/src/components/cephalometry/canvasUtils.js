export const drawLine = (ctx, points, point1Id, point2Id, options) => {
  const { imageX, imageY, scale, color = '#00ff00', lineWidth = 2 } = options;
  if (points[point1Id] && points[point2Id]) {
    const p1 = points[point1Id];
    const p2 = points[point2Id];
    ctx.beginPath();
    ctx.moveTo(imageX + p1.x * scale, imageY + p1.y * scale);
    ctx.lineTo(imageX + p2.x * scale, imageY + p2.y * scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

export const drawAngle = (ctx, points, p1Id, vId, p2Id, options) => {
  const { imageX, imageY, scale, color = '#ff0000', lineWidth = 2, radius = 30 } = options;
  if (points[p1Id] && points[vId] && points[p2Id]) {
    const p1 = points[p1Id];
    const v = points[vId];
    const p2 = points[p2Id];
    const x1 = imageX + p1.x * scale;
    const y1 = imageY + p1.y * scale;
    const vx = imageX + v.x * scale;
    const vy = imageY + v.y * scale;
    const x2 = imageX + p2.x * scale;
    const y2 = imageY + p2.y * scale;
    
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(x1, y1);
    ctx.moveTo(vx, vy);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Arc drawing logic could be added here if needed
  }
};

export const drawAllElements = (ctx, state, options) => {
  const { cephalometryData, selectedPoint, showPlanes, showAngles, activeTool } = state;
  const { img, imageX, imageY, scale, imgWidth, imgHeight } = options;

  ctx.drawImage(img, imageX, imageY, imgWidth * scale, imgHeight * scale);
  
  const points = cephalometryData.points;
  const lineOpts = { imageX, imageY, scale, color: '#0000ff', lineWidth: 2 };

  if (cephalometryData.projectionType === 'lateral') {
    if (showPlanes.nsl) drawLine(ctx, points, 'N', 'S', lineOpts);
    if (showPlanes.fh) drawLine(ctx, points, 'Po', 'Or', lineOpts);
    if (showPlanes.nl) drawLine(ctx, points, 'ANS', 'PNS', lineOpts);
    if (showPlanes.ocp) drawLine(ctx, points, 'P6', 'E1', lineOpts);
    if (showPlanes.ml) drawLine(ctx, points, 'Go', 'Me', lineOpts);
    if (showPlanes.goAr) drawLine(ctx, points, 'Go', 'Ar', lineOpts);
  } else if (cephalometryData.projectionType === 'frontal') {
    if (showPlanes.nsl) drawLine(ctx, points, 'N', 'Me', lineOpts);
    if (showPlanes.fh) drawLine(ctx, points, 'SO_L', 'SO_R', lineOpts);
    if (showPlanes.nl) drawLine(ctx, points, 'Z_L', 'Z_R', lineOpts);
    if (showPlanes.ocp) drawLine(ctx, points, 'Co_L', 'Co_R', lineOpts);
  }

  // Draw points
  Object.entries(points || {}).forEach(([id, point]) => {
    const adjX = imageX + point.x * scale;
    const adjY = imageY + point.y * scale;
    ctx.beginPath();
    ctx.arc(adjX, adjY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = selectedPoint === id ? '#ff0000' : '#0000ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(id, adjX + 12, adjY - 12);
  });

  // Scale points
  if (activeTool === 'scale') {
    const sp = cephalometryData.scalePoints;
    if (sp.point0) {
      ctx.beginPath();
      ctx.arc(imageX + sp.point0.x * scale, imageY + sp.point0.y * scale, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#00ff00';
      ctx.fill();
    }
    if (sp.point10) {
      ctx.beginPath();
      ctx.arc(imageX + sp.point10.x * scale, imageY + sp.point10.y * scale, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff9900';
      ctx.fill();
    }
  }
};
