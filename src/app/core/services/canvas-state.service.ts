import { Injectable, computed, signal } from '@angular/core';
import { clampZoom, zoomAround, type Point, type Viewport } from './geometry';
import { PersistenceService, type CanvasLayout, type PanelState } from './persistence.service';

export type { PanelState } from './persistence.service';

export interface CanvasStateDefaults {
  viewportX: number;
  viewportY: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

const DEFAULTS: CanvasStateDefaults = {
  viewportX: -80,
  viewportY: -40,
  zoom: 0.85,
  minZoom: 0.25,
  maxZoom: 4,
};

@Injectable({
  providedIn: 'root',
})
export class CanvasStateService {
  private readonly _viewportX = signal(DEFAULTS.viewportX);
  private readonly _viewportY = signal(DEFAULTS.viewportY);
  private readonly _zoom = signal(DEFAULTS.zoom);
  private readonly _panels = signal<PanelState[]>([]);
  private readonly _isRestored = signal(false);

  // Computed viewport
  readonly viewport = computed<Viewport>(() => ({
    x: this._viewportX(),
    y: this._viewportY(),
    zoom: this._zoom(),
  }));

  readonly viewportX = this._viewportX.asReadonly();
  readonly viewportY = this._viewportY.asReadonly();
  readonly zoom = this._zoom.asReadonly();
  readonly panels = this._panels.asReadonly();
  readonly isRestored = this._isRestored.asReadonly();

  constructor(private readonly persistence: PersistenceService) {
    this.restore();
  }

  private restore(): void {
    // Siempre arrancar en la posición inicial (no recordar última posición)
    const initialPanels = this.getInitialPanels();
    this._panels.set(initialPanels);
    this.applyInitialViewport(initialPanels);
    this._isRestored.set(true);
    // Limpiar cualquier layout guardado para forzar inicial en próximos reloads
    this.persistence.clear();
  }

  private persist(): void {
    const layout: CanvasLayout = {
      viewportX: this._viewportX(),
      viewportY: this._viewportY(),
      zoom: this._zoom(),
      panels: this._panels(),
    };
    this.persistence.save(layout);
  }

  private getInitialPanels(): PanelState[] {
    return [
      {
        id: 'hero',
        x: -40,
        y: 0,
        zIndex: 1,
        rotation: -1.0,
      },
      {
        id: 'projects',
        x: 360,
        y: 40,
        zIndex: 2,
        rotation: 0.8,
      },
      {
        id: 'about',
        x: -120,
        y: 320,
        zIndex: 3,
        rotation: 0.5,
      },
      {
        id: 'experience',
        x: 320,
        y: 360,
        zIndex: 4,
        rotation: -0.8,
      },
      {
        id: 'contact',
        x: 40,
        y: 640,
        zIndex: 5,
        rotation: 0.6,
      },
    ];
  }

  setViewport(x: number, y: number, zoom: number): void {
    const clampedZoom = clampZoom(zoom, DEFAULTS.minZoom, DEFAULTS.maxZoom);
    this._viewportX.set(Number.isFinite(x) ? x : this._viewportX());
    this._viewportY.set(Number.isFinite(y) ? y : this._viewportY());
    this._zoom.set(clampedZoom);
    this.persist();
  }

  setViewportXY(x: number, y: number): void {
    this._viewportX.set(Number.isFinite(x) ? x : this._viewportX());
    this._viewportY.set(Number.isFinite(y) ? y : this._viewportY());
    this.persist();
  }

  setZoom(zoom: number): void {
    const clampedZoom = clampZoom(zoom, DEFAULTS.minZoom, DEFAULTS.maxZoom);
    this._zoom.set(clampedZoom);
    this.persist();
  }

  zoomAroundScreenPoint(screenPoint: Point, factor: number): void {
    const vp = this.viewport();
    const next = zoomAround(screenPoint, factor, vp, DEFAULTS.minZoom, DEFAULTS.maxZoom);
    this._viewportX.set(next.x);
    this._viewportY.set(next.y);
    this._zoom.set(next.zoom);
    this.persist();
  }

  updatePanel(id: string, updates: Partial<Omit<PanelState, 'id'>>): void {
    const panels = this._panels();
    const idx = panels.findIndex((p) => p.id === id);
    if (idx === -1) return;

    const current = panels[idx];
    const next: PanelState = {
      ...current,
      ...updates,
    };

    // Sanitize
    if (!Number.isFinite(next.x)) next.x = current.x;
    if (!Number.isFinite(next.y)) next.y = current.y;
    if (!Number.isFinite(next.zIndex)) next.zIndex = current.zIndex;
    else next.zIndex = Math.trunc(next.zIndex);
    if (!Number.isFinite(next.rotation)) next.rotation = current.rotation;

    const updated = [...panels];
    updated[idx] = next;
    this._panels.set(updated);
    this.persist();
  }

  bringToFront(id: string): void {
    const panels = this._panels();
    const maxZ = Math.max(...panels.map((p) => p.zIndex), 0);
    this.updatePanel(id, { zIndex: maxZ + 1 });
  }

  private applyInitialViewport(panels: PanelState[]): void {
    if (panels.length === 0) {
      this._viewportX.set(DEFAULTS.viewportX);
      this._viewportY.set(DEFAULTS.viewportY);
      this._zoom.set(DEFAULTS.zoom);
      return;
    }

    let minX = panels[0].x;
    let maxX = panels[0].x;
    let minY = panels[0].y;
    let maxY = panels[0].y;

    for (let i = 1; i < panels.length; i++) {
      const p = panels[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const panelWidth = 320;
    const panelHeight = 240;
    const padding = 120;

    const groupWidth = maxX - minX + panelWidth;
    const groupHeight = maxY - minY + panelHeight;

    if (typeof window !== 'undefined') {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const zoomX = (vw - padding * 2) / groupWidth;
      const zoomY = (vh - padding * 2) / groupHeight;
      let zoom = Math.min(zoomX, zoomY, DEFAULTS.maxZoom);
      if (zoom < DEFAULTS.minZoom) zoom = DEFAULTS.minZoom;
      if (zoom > 1.1) zoom = 1.05;
      if (zoom < 0.6) zoom = 0.7;

      const centerX = minX + groupWidth / 2;
      const centerY = minY + groupHeight / 2;
      this._viewportX.set(vw / 2 - centerX * zoom);
      this._viewportY.set(vh / 2 - centerY * zoom);
      this._zoom.set(clampZoom(zoom, DEFAULTS.minZoom, DEFAULTS.maxZoom));
      return;
    }

    const vw = 1280;
    const vh = 720;
    const zoomX = (vw - padding * 2) / groupWidth;
    const zoomY = (vh - padding * 2) / groupHeight;
    const zoom = Math.min(zoomX, zoomY, 0.95);
    const centerX = minX + groupWidth / 2;
    const centerY = minY + groupHeight / 2;
    this._viewportX.set(vw / 2 - centerX * zoom);
    this._viewportY.set(vh / 2 - centerY * zoom);
    this._zoom.set(clampZoom(zoom, DEFAULTS.minZoom, DEFAULTS.maxZoom));
  }

  resetLayout(): void {
    const initialPanels = this.getInitialPanels();
    this._panels.set(initialPanels);
    this.applyInitialViewport(initialPanels);
    this.persistence.clear();
  }

  recenter(): void {
    this.applyInitialViewport(this._panels());
    this.persist();
  }
}
