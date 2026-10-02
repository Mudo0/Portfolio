import { describe, it, expect } from 'vitest';
import { screenToWorld, worldToScreen, clampZoom, zoomAround } from './geometry';
import type { Point, Viewport } from './geometry';

describe('geometry', () => {
  describe('screenToWorld / worldToScreen', () => {
    it('should be inverses at identity (zoom=1, translate=0,0)', () => {
      const viewport: Viewport = { x: 0, y: 0, zoom: 1 };
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: -10, y: -20 },
        { x: 1920, y: 1080 },
      ];

      for (const p of points) {
        const world = screenToWorld(p, viewport);
        const back = worldToScreen(world, viewport);
        expect(back.x).toBeCloseTo(p.x, 6);
        expect(back.y).toBeCloseTo(p.y, 6);
      }
    });

    it('should be inverses with translation only', () => {
      const viewport: Viewport = { x: 120, y: 80, zoom: 1 };
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 250, y: 300 },
        { x: -50, y: 100 },
      ];

      for (const p of points) {
        const world = screenToWorld(p, viewport);
        const back = worldToScreen(world, viewport);
        expect(back.x).toBeCloseTo(p.x, 6);
        expect(back.y).toBeCloseTo(p.y, 6);
      }
    });

    it('should be inverses with zoom != 1', () => {
      const viewports: Viewport[] = [
        { x: 0, y: 0, zoom: 0.5 },
        { x: 0, y: 0, zoom: 1.5 },
        { x: 0, y: 0, zoom: 2 },
        { x: 0, y: 0, zoom: 0.25 },
        { x: 200, y: 150, zoom: 1.25 },
        { x: -100, y: -50, zoom: 0.8 },
      ];
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 400, y: 300 },
        { x: 1280, y: 720 },
        { x: -30, y: 60 },
      ];

      for (const vp of viewports) {
        for (const p of points) {
          const world = screenToWorld(p, vp);
          const back = worldToScreen(world, vp);
          expect(back.x).toBeCloseTo(p.x, 6);
          expect(back.y).toBeCloseTo(p.y, 6);
        }
      }
    });

    it('should handle zoom <= 0 gracefully', () => {
      const vpZero: Viewport = { x: 10, y: 20, zoom: 0 };
      const vpNeg: Viewport = { x: 10, y: 20, zoom: -1 };
      const p: Point = { x: 100, y: 50 };

      // No NaN, no Infinity
      const w1 = screenToWorld(p, vpZero);
      const s1 = worldToScreen(w1, vpZero);
      const w2 = screenToWorld(p, vpNeg);
      const s2 = worldToScreen(w2, vpNeg);

      expect(Number.isFinite(w1.x)).toBe(true);
      expect(Number.isFinite(w1.y)).toBe(true);
      expect(Number.isFinite(s1.x)).toBe(true);
      expect(Number.isFinite(s1.y)).toBe(true);
      expect(Number.isFinite(w2.x)).toBe(true);
      expect(Number.isFinite(w2.y)).toBe(true);
      expect(Number.isFinite(s2.x)).toBe(true);
      expect(Number.isFinite(s2.y)).toBe(true);
    });
  });

  describe('clampZoom', () => {
    it('should respect min and max', () => {
      expect(clampZoom(0.1, 0.25, 4)).toBe(0.25);
      expect(clampZoom(5, 0.25, 4)).toBe(4);
      expect(clampZoom(1, 0.25, 4)).toBe(1);
      expect(clampZoom(0.25, 0.25, 4)).toBe(0.25);
      expect(clampZoom(4, 0.25, 4)).toBe(4);
    });

    it('should handle negative values', () => {
      expect(clampZoom(-1, 0.25, 4)).toBe(0.25);
      expect(clampZoom(-0.5, 0.5, 2)).toBe(0.5);
    });

    it('should handle NaN and non-finite values', () => {
      expect(clampZoom(NaN, 0.25, 4)).toBe(0.25);
      expect(clampZoom(Infinity, 0.25, 4)).toBe(4);
      expect(clampZoom(-Infinity, 0.25, 4)).toBe(0.25);
    });
  });

  describe('zoomAround', () => {
    it('should not move the point under cursor when zooming in', () => {
      const viewport: Viewport = { x: 0, y: 0, zoom: 1 };
      const cursor: Point = { x: 200, y: 150 };

      const vp2 = zoomAround(cursor, 2, viewport); // zoom in 2x
      const worldAtCursor = screenToWorld(cursor, viewport);
      const screenAfter = worldToScreen(worldAtCursor, vp2);

      expect(screenAfter.x).toBeCloseTo(cursor.x, 6);
      expect(screenAfter.y).toBeCloseTo(cursor.y, 6);
    });

    it('should not move the point under cursor when zooming out', () => {
      const viewport: Viewport = { x: 100, y: 50, zoom: 2 };
      const cursor: Point = { x: 400, y: 300 };

      const vp2 = zoomAround(cursor, 0.5, viewport); // zoom out
      const worldAtCursor = screenToWorld(cursor, viewport);
      const screenAfter = worldToScreen(worldAtCursor, vp2);

      expect(screenAfter.x).toBeCloseTo(cursor.x, 6);
      expect(screenAfter.y).toBeCloseTo(cursor.y, 6);
    });

    it('should not move the point under cursor with translation + zoom', () => {
      const viewports: Viewport[] = [
        { x: 250, y: 180, zoom: 1.2 },
        { x: -50, y: 30, zoom: 0.8 },
        { x: 0, y: 0, zoom: 0.5 },
      ];
      const cursors: Point[] = [
        { x: 0, y: 0 },
        { x: 640, y: 360 },
        { x: 1200, y: 800 },
      ];

      for (const vp of viewports) {
        for (const c of cursors) {
          const vpIn = zoomAround(c, 1.25, vp);
          const vpOut = zoomAround(c, 0.8, vp);
          const w = screenToWorld(c, vp);
          expect(worldToScreen(w, vpIn).x).toBeCloseTo(c.x, 6);
          expect(worldToScreen(w, vpIn).y).toBeCloseTo(c.y, 6);
          expect(worldToScreen(w, vpOut).x).toBeCloseTo(c.x, 6);
          expect(worldToScreen(w, vpOut).y).toBeCloseTo(c.y, 6);
        }
      }
    });

    it('should respect min/max zoom', () => {
      const vp: Viewport = { x: 0, y: 0, zoom: 1 };
      const c: Point = { x: 100, y: 100 };

      const v1 = zoomAround(c, 0.01, vp, 0.25, 4); // try to go below min
      const v2 = zoomAround(c, 100, vp, 0.25, 4); // try to go above max

      expect(v1.zoom).toBe(0.25);
      expect(v2.zoom).toBe(4);
    });

    it('should return unchanged viewport for invalid factor', () => {
      const vp: Viewport = { x: 10, y: 20, zoom: 1.5 };
      const c: Point = { x: 50, y: 50 };

      const v1 = zoomAround(c, 0, vp);
      const v2 = zoomAround(c, -1, vp);
      const v3 = zoomAround(c, NaN, vp);
      const v4 = zoomAround(c, Infinity, vp);

      expect(v1).toEqual(vp);
      expect(v2).toEqual(vp);
      expect(v3).toEqual(vp);
      expect(v4).toEqual(vp);
    });

    it('should not change zoom if already at boundary and factor pushes further', () => {
      const vpMin: Viewport = { x: 0, y: 0, zoom: 0.25 };
      const vpMax: Viewport = { x: 0, y: 0, zoom: 4 };
      const c: Point = { x: 100, y: 100 };

      const r1 = zoomAround(c, 0.5, vpMin);
      const r2 = zoomAround(c, 2, vpMax);

      expect(r1.zoom).toBe(0.25);
      expect(r2.zoom).toBe(4);
      // viewport x,y may change? No — if zoom doesn't change, we return original zoom but formula gives same point? Wait: we return early if |newZoom-zoom| < 1e-6, so returns original viewport object
      expect(r1).toEqual(vpMin);
      expect(r2).toEqual(vpMax);
    });
  });
});
