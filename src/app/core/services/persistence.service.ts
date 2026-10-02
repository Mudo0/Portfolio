import { Injectable } from '@angular/core';

export interface PanelState {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  rotation: number;
}

export interface CanvasLayout {
  viewportX: number;
  viewportY: number;
  zoom: number;
  panels: PanelState[];
}

const STORAGE_KEY = 'portfolio-canvas-layout';

@Injectable({
  providedIn: 'root',
})
export class PersistenceService {
  private isAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  load(): CanvasLayout | null {
    if (!this.isAvailable()) return null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<CanvasLayout>;

      if (!parsed || typeof parsed !== 'object') return null;

      // Validate and provide defaults
      const viewportX = typeof parsed.viewportX === 'number' ? parsed.viewportX : 0;
      const viewportY = typeof parsed.viewportY === 'number' ? parsed.viewportY : 0;
      const zoom = typeof parsed.zoom === 'number' ? parsed.zoom : 1;
      const panels = Array.isArray(parsed.panels) ? parsed.panels : [];

      // Sanitize panels
      const sanitizedPanels: PanelState[] = panels
        .filter((p) => p && typeof p === 'object')
        .map((p) => ({
          id: typeof p.id === 'string' ? p.id : 'panel',
          x: typeof p.x === 'number' && Number.isFinite(p.x) ? p.x : 0,
          y: typeof p.y === 'number' && Number.isFinite(p.y) ? p.y : 0,
          zIndex: typeof p.zIndex === 'number' && Number.isFinite(p.zIndex) ? Math.trunc(p.zIndex) : 1,
          rotation: typeof p.rotation === 'number' && Number.isFinite(p.rotation) ? p.rotation : 0,
        }));

      return {
        viewportX,
        viewportY,
        zoom,
        panels: sanitizedPanels,
      };
    } catch {
      return null;
    }
  }

  save(layout: CanvasLayout): void {
    if (!this.isAvailable()) return;

    try {
      // Only persist finite numbers
      const safeLayout: CanvasLayout = {
        viewportX: Number.isFinite(layout.viewportX) ? layout.viewportX : 0,
        viewportY: Number.isFinite(layout.viewportY) ? layout.viewportY : 0,
        zoom: Number.isFinite(layout.zoom) ? layout.zoom : 1,
        panels: layout.panels.map((p) => ({
          id: p.id,
          x: Number.isFinite(p.x) ? p.x : 0,
          y: Number.isFinite(p.y) ? p.y : 0,
          zIndex: Number.isFinite(p.zIndex) ? Math.trunc(p.zIndex) : 1,
          rotation: Number.isFinite(p.rotation) ? p.rotation : 0,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeLayout));
    } catch {
      // Silently ignore storage errors
    }
  }

  clear(): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently ignore
    }
  }
}
