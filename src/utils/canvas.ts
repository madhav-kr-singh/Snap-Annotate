import { AnnotationItem, ImageItem, AnnotationGroup, Point } from '../types';

/**
 * Draws all annotations onto a 2D Canvas Context for a single image.
 */
export function drawAnnotationsOnCanvas(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationItem[],
  selectedId: string | null = null
) {
  ctx.save();

  annotations.forEach((item) => {
    const isSelected = item.id === selectedId;

    switch (item.type) {
      case 'stepNumber': {
        const radius = item.size / 2;
        const badgeStyle = item.badgeStyle || 'circle';

        ctx.save();
        ctx.shadowColor = badgeStyle === 'glow' ? item.color : 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = badgeStyle === 'glow' ? 18 : 8;
        ctx.shadowOffsetY = badgeStyle === 'glow' ? 0 : 3;

        ctx.beginPath();
        if (badgeStyle === 'square') {
          drawRoundedRect(ctx, item.position.x - radius, item.position.y - radius, item.size, item.size, 8);
        } else if (badgeStyle === 'pill') {
          const pillW = item.size * 1.3;
          drawRoundedRect(ctx, item.position.x - pillW / 2, item.position.y - radius, pillW, item.size, radius);
        } else {
          ctx.arc(item.position.x, item.position.y, radius, 0, 2 * Math.PI);
        }

        ctx.fillStyle = item.color;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = item.textColor || '#FFFFFF';
        ctx.font = `bold ${Math.max(12, Math.round(item.size * 0.48))}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.text, item.position.x, item.position.y + 1);
        break;
      }

      case 'rectangle': {
        const { x, y } = item.position;
        const { width, height } = item;
        const borderWidth = item.borderWidth || 4;
        const boxStyle = item.boxStyle || 'solid';
        const radius = item.cornerRadius || 8;

        ctx.save();
        ctx.strokeStyle = item.borderColor || item.color;
        ctx.lineWidth = borderWidth;

        if (boxStyle === 'dashed') {
          ctx.setLineDash([8, 6]);
        } else {
          ctx.setLineDash([]);
        }

        if (boxStyle === 'glow') {
          ctx.shadowColor = item.color || item.borderColor;
          ctx.shadowBlur = 16;
        } else {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 6;
        }

        if (radius > 0) {
          drawRoundedRect(ctx, x, y, width, height, radius);
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, width, height);
        }

        if (boxStyle === 'filled' || (item.backgroundColor && item.backgroundColor !== 'transparent')) {
          const fillAlpha = boxStyle === 'filled' ? 0.2 : 0.1;
          ctx.fillStyle = hexToRgba(item.backgroundColor || item.color || item.borderColor, fillAlpha);
          if (radius > 0) {
            drawRoundedRect(ctx, x, y, width, height, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, width, height);
          }
        }

        ctx.restore();
        break;
      }

      case 'textBox': {
        const { x, y } = item.position;
        const { width, height } = item;

        // Draw Connector Lines & Arrowheads for all targetPoints
        const targets: Point[] =
          item.targetPoints && item.targetPoints.length > 0
            ? item.targetPoints
            : item.targetPoint
            ? [item.targetPoint]
            : [];

        targets.forEach((tPoint) => {
          const { x: targetX, y: targetY } = tPoint;

          // Compute perimeter anchor on callout box based on target direction
          const centerX = x + width / 2;
          const centerY = y + height / 2;
          const dxCenter = targetX - centerX;
          const dyCenter = targetY - centerY;

          let startX = centerX;
          let startY = centerY;

          if (Math.abs(dxCenter) >= Math.abs(dyCenter)) {
            // Exit horizontally from left or right edge
            startX = dxCenter > 0 ? x + width : x;
            startY = Math.max(y + 8, Math.min(y + height - 8, targetY));
          } else {
            // Exit vertically from top or bottom edge
            startY = dyCenter > 0 ? y + height : y;
            startX = Math.max(x + 8, Math.min(x + width - 8, targetX));
          }

          const strokeColor = item.borderColor || item.color || '#6366F1';
          const strokeWidth = item.borderWidth || 3;

          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          let endAngle = 0;

          if (item.connectorStyle === 'straight') {
            ctx.moveTo(startX, startY);
            ctx.lineTo(targetX, targetY);
            endAngle = Math.atan2(targetY - startY, targetX - startX);
          } else if (item.connectorStyle === 'elbow') {
            const dx = targetX - startX;
            const dy = targetY - startY;
            const r = Math.min(24, Math.abs(dx) / 2, Math.abs(dy) / 2);

            ctx.moveTo(startX, startY);

            if (r < 3) {
              if (startX === x || startX === x + width) {
                ctx.lineTo(targetX, startY);
                ctx.lineTo(targetX, targetY);
                endAngle = Math.atan2(dy, 0);
              } else {
                ctx.lineTo(startX, targetY);
                ctx.lineTo(targetX, targetY);
                endAngle = Math.atan2(0, dx);
              }
            } else if (startY === y || startY === y + height) {
              // Exits vertically (top/bottom) -> goes vertical then curves 90deg horizontal to target
              ctx.arcTo(startX, targetY, targetX, targetY, r);
              ctx.lineTo(targetX, targetY);
              endAngle = Math.atan2(0, dx);
            } else {
              // Exits horizontally (left/right) -> goes horizontal then curves 90deg vertical to target
              ctx.arcTo(targetX, startY, targetX, targetY, r);
              ctx.lineTo(targetX, targetY);
              endAngle = Math.atan2(dy, 0);
            }
          } else if (item.connectorStyle === 'curved') {
            const cpX = (startX + targetX) / 2;
            const cpY = startY;
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cpX, cpY, targetX, targetY);
            endAngle = Math.atan2(targetY - cpY, targetX - cpX);
          }

          ctx.stroke();

          // Draw Arrowhead pointing directly to targetPoint
          drawArrowhead(ctx, targetX, targetY, endAngle, strokeColor, Math.max(12, strokeWidth * 3.5));

          // Target point node dot
          ctx.beginPath();
          ctx.arc(targetX, targetY, 4, 0, 2 * Math.PI);
          ctx.fillStyle = strokeColor;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
          ctx.restore();
        });

        // Draw Callout Box
        ctx.save();
        const borderRadius = item.cornerRadius || 8;
        drawRoundedRect(ctx, x, y, width, height, borderRadius);
        ctx.fillStyle = item.backgroundColor || '#1E1E24';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.lineWidth = item.borderWidth || 2;
        ctx.strokeStyle = item.borderColor || item.color || '#6366F1';
        ctx.stroke();

        // Draw Text inside Callout Box with Multi-Line \\n support
        ctx.fillStyle = item.textColor || '#FFFFFF';
        ctx.font = `${item.fontSize || 14}px 'Inter', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const padding = 10;
        wrapText(ctx, item.text ?? '', x + padding, y + padding, width - padding * 2, (item.fontSize || 14) + 4);
        ctx.restore();
        break;
      }

      case 'blur': {
        const { x, y } = item.position;
        const { width, height } = item;

        if (width > 5 && height > 5) {
          try {
            const offCanvas = document.createElement('canvas');
            const sampleFactor = 0.1;
            const smallW = Math.max(1, Math.floor(width * sampleFactor));
            const smallH = Math.max(1, Math.floor(height * sampleFactor));

            offCanvas.width = smallW;
            offCanvas.height = smallH;
            const offCtx = offCanvas.getContext('2d');

            if (offCtx) {
              offCtx.imageSmoothingEnabled = false;
              offCtx.drawImage(ctx.canvas, x, y, width, height, 0, 0, smallW, smallH);

              ctx.save();
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(offCanvas, 0, 0, smallW, smallH, x, y, width, height);
              ctx.restore();
            }
          } catch (e) {
            console.warn('Blur rendering warning:', e);
          }
        }

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isSelected ? '#6366F1' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
        break;
      }
    }
  });

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

/**
 * Draws a sharp arrowhead at (x, y) along angle
 */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  size: number = 14
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.45);
  ctx.lineTo(-size * 0.65, 0);
  ctx.lineTo(-size, size * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Text wrapper with multi-line (\n) support
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  if (!text) return;
  const paragraphs = text.split('\n');
  let currentY = y;

  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const word = words[n];

      // If a single word exceeds maxWidth, break it character-by-character
      if (ctx.measureText(word).width > maxWidth) {
        if (line) {
          ctx.fillText(line, x, currentY);
          line = '';
          currentY += lineHeight;
        }
        for (let c = 0; c < word.length; c++) {
          const char = word[c];
          if (ctx.measureText(line + char).width > maxWidth) {
            ctx.fillText(line, x, currentY);
            line = char;
            currentY += lineHeight;
          } else {
            line += char;
          }
        }
        line += ' ';
        continue;
      }

      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim().length > 0) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }
}

export function renderMergedGuideCanvas(
  images: ImageItem[],
  annotationsPerImage: Record<number, AnnotationItem[]>,
  groupSettings: AnnotationGroup
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || images.length === 0) return canvas;

  const { layout, borderWidth, spacing, borderColor } = groupSettings;

  if (layout === 'vertical') {
    const maxWidth = Math.max(...images.map((img) => img.width));
    const scaledHeights = images.map((img) => img.height * (maxWidth / img.width));

    const totalWidth = maxWidth + borderWidth * 2;
    const totalHeight =
      scaledHeights.reduce((sum, h) => sum + h, 0) +
      spacing * (images.length - 1) +
      borderWidth * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = borderColor || '#1E1E24';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    let currentY = borderWidth;

    images.forEach((imgObj, idx) => {
      const scaleRatio = maxWidth / imgObj.width;
      const scaledH = imgObj.height * scaleRatio;

      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = imgObj.width;
      imgCanvas.height = imgObj.height;
      const imgCtx = imgCanvas.getContext('2d')!;

      imgCtx.drawImage(imgObj.imgElement, 0, 0);

      const annotations = annotationsPerImage[idx] || [];
      drawAnnotationsOnCanvas(imgCtx, annotations);

      ctx.drawImage(imgCanvas, borderWidth, currentY, maxWidth, scaledH);

      currentY += scaledH;

      if (idx < images.length - 1) {
        ctx.fillStyle = borderColor || '#1E1E24';
        ctx.fillRect(borderWidth, currentY, maxWidth, spacing);
        currentY += spacing;
      }
    });
  } else {
    const maxHeight = Math.max(...images.map((img) => img.height));
    const scaledWidths = images.map((img) => img.width * (maxHeight / img.height));

    const totalWidth =
      scaledWidths.reduce((sum, w) => sum + w, 0) +
      spacing * (images.length - 1) +
      borderWidth * 2;
    const totalHeight = maxHeight + borderWidth * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = borderColor || '#1E1E24';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    let currentX = borderWidth;

    images.forEach((imgObj, idx) => {
      const scaleRatio = maxHeight / imgObj.height;
      const scaledW = imgObj.width * scaleRatio;

      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = imgObj.width;
      imgCanvas.height = imgObj.height;
      const imgCtx = imgCanvas.getContext('2d')!;

      imgCtx.drawImage(imgObj.imgElement, 0, 0);
      const annotations = annotationsPerImage[idx] || [];
      drawAnnotationsOnCanvas(imgCtx, annotations);

      ctx.drawImage(imgCanvas, currentX, borderWidth, scaledW, maxHeight);
      currentX += scaledW;

      if (idx < images.length - 1) {
        ctx.fillStyle = borderColor || '#1E1E24';
        ctx.fillRect(currentX, borderWidth, spacing, maxHeight);
        currentX += spacing;
      }
    });
  }

  return canvas;
}
