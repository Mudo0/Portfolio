/**
 * Pure geometry utilities for infinite canvas
 * No DOM, no signals, no side effects. Pure functions only.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  x: number; // translate X (world -> screen offset)
  y: number; // translate Y (world -> screen offset)
  zoom: number; // scale factor
}

/**
 * Convert screen coordinates to world coordinates
 * @param point - Point in screen space (clientX, clientY)
 * @param viewport - Current viewport {x,y,zoom}
 * @returns Point in world space
 */
export function screenToWorld(point: Point, viewport: Viewport): Point {
  const { x, y, zoom } = viewport;
  if (zoom <= 0) {
    return { x: point.x - x, y: point.y - y };
  }
  return {
    x: (point.x - x) / zoom,
    y: (point.y - y) / zoom,
  };
}

/**
 * Convert world coordinates to screen coordinates
 * @param point - Point in world space
 * @param viewport - Current viewport {x,y,zoom}
 * @returns Point in screen space
 */
export function worldToScreen(point: Point, viewport: Viewport): Point {
  const { x, y, zoom } = viewport;
  if (zoom <= 0) {
    return { x: point.x + x, y: point.y + y };
  }
  return {
    x: point.x * zoom + x,
    y: point.y * zoom + y,
  };
}

/**
 * Clamp zoom value between min and max
 * @param zoom - Zoom value to clamp
 * @param min - Minimum zoom allowed
 * @param max - Maximum zoom allowed
 * @returns Clamped zoom value
 */
export function clampZoom(zoom: number, min: number, max: number): number {
  if (Number.isNaN(zoom)) {
    return min;
  }
  if (!Number.isFinite(zoom)) {
    // +Infinity -> max, -Infinity -> min
    return zoom > 0 ? max : min;
  }
  if (zoom < min) return min;
  if (zoom > max) return max;
  return zoom;
}

/**
 * Zoom around a fixed point (cursor/pinch center)
 * Maintains the point under cursor at the same screen position after zoom
 * Formula: vx = mx - wx * newZoom, vy = my - wy * newZoom
 * where (wx,wy) = screenToWorld({mx,my}, {vx,vy,zoom})
 * @param screenPoint - Point in screen space to zoom around (mx,my)
 * @param factor - Zoom factor (e.g., 1.1 to zoom in, 0.9 to zoom out)
 * @param viewport - Current viewport {x,y,zoom}
 * @param minZoom - Minimum zoom allowed (default 0.25)
 * @param maxZoom - Maximum zoom allowed (default 4)
 * @returns New viewport with updated x,y,zoom
 */
export function zoomAround(
  screenPoint: Point,
  factor: number,
  viewport: Viewport,
  minZoom = 0.25,
  maxZoom = 4
): Viewport {
  const { x, y, zoom } = viewport;
  if (factor <= 0 || zoom <= 0 || !Number.isFinite(factor)) {
    return { x, y, zoom };
  }

  const newZoom = clampZoom(zoom * factor, minZoom, maxZoom);
  if (Math.abs(newZoom - zoom) < 1e-6) {
    return { x, y, zoom };
  }

  // World point under cursor
  const worldPoint = screenToWorld(screenPoint, { x, y, zoom });

  // Keep that world point at the same screen position
  const newX = screenPoint.x - worldPoint.x * newZoom;
  const newY = screenPoint.y - worldPoint.y * newZoom;

  return {
    x: newX,
    y: newY,
    zoom: newZoom,
  };
}
