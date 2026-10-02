import { Component, effect, ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { PanelComponent } from '../panels/panel.component';
import { HeroPanelComponent } from '../panels/hero/hero-panel.component';
import { ProjectsPanelComponent } from '../panels/projects/projects-panel.component';
import { AboutPanelComponent } from '../panels/about/about-panel.component';
import { ExperiencePanelComponent } from '../panels/experience/experience-panel.component';
import { ContactPanelComponent } from '../panels/contact/contact-panel.component';
import { CanvasStateService } from '../../core/services/canvas-state.service';
import type { Point } from '../../core/services/geometry';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    NgClass,
    PanelComponent,
    HeroPanelComponent,
    ProjectsPanelComponent,
    AboutPanelComponent,
    ExperiencePanelComponent,
    ContactPanelComponent,
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent {
  private readonly state = inject(CanvasStateService);
  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewport');

  readonly viewportX = this.state.viewportX;
  readonly viewportY = this.state.viewportY;
  readonly zoom = this.state.zoom;
  readonly panels = this.state.panels;
  readonly isRestored = this.state.isRestored;

  // Pan
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartVx = 0;
  private panStartVy = 0;

  // Drag
  private draggingId: string | null = null;
  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private panelStartX = 0;
  private panelStartY = 0;

  // Pinch
  private readonly pointers = new Map<number, PointerEvent>();
  private pinchActive = false;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;
  private pinchCenterX = 0;
  private pinchCenterY = 0;
  private pinchStartVx = 0;
  private pinchStartVy = 0;

  constructor() {
    // Prevent text selection while interacting
    effect(() => {
      // no-op, just ensures signals tracked if needed
    });
  }

  onPointerDownViewport(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.app-panel')) return;

    event.preventDefault();
    this.isPanning = true;
    const viewport = this.viewportRef()?.nativeElement;
    if (viewport) {
      viewport.classList.add('panning');
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch {}
    }

    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panStartVx = this.viewportX();
    this.panStartVy = this.viewportY();
  }

  onPanelPointerDown(panelId: string, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Cancel pan if active
    this.isPanning = false;
    const viewport = this.viewportRef()?.nativeElement;
    if (viewport) viewport.classList.remove('panning');

    this.draggingId = panelId;
    this.dragPointerId = event.pointerId;

    const target = event.currentTarget as HTMLElement;
    target.classList.add('dragging');
    try {
      target.setPointerCapture(event.pointerId);
    } catch {}

    const panel = this.panels().find((p) => p.id === panelId);
    this.panelStartX = panel?.x ?? 0;
    this.panelStartY = panel?.y ?? 0;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.state.bringToFront(panelId);
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    this.pointers.set(event.pointerId, event);

    // 1. DRAG tiene prioridad absoluta
    if (this.draggingId && event.pointerId === this.dragPointerId) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;
      const newX = this.panelStartX + dx / this.zoom();
      const newY = this.panelStartY + dy / this.zoom();
      this.state.updatePanel(this.draggingId, { x: newX, y: newY });
      return;
    }

    // 2. Pinch (2 punteros)
    if (this.pointers.size === 2) {
      const arr = Array.from(this.pointers.values());
      const p1 = arr[0];
      const p2 = arr[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const centerX = (p1.clientX + p2.clientX) / 2;
      const centerY = (p1.clientY + p2.clientY) / 2;

      if (!this.pinchActive) {
        this.pinchActive = true;
        this.pinchStartDist = dist;
        this.pinchStartZoom = this.zoom();
        this.pinchStartVx = this.viewportX();
        this.pinchStartVy = this.viewportY();
        const rect = this.viewportRef()?.nativeElement?.getBoundingClientRect();
        const left = rect?.left ?? 0;
        const top = rect?.top ?? 0;
        this.pinchCenterX = centerX - left;
        this.pinchCenterY = centerY - top;
      } else {
        const factor = this.pinchStartDist > 0 ? dist / this.pinchStartDist : 1;
        const viewport = this.viewportRef()?.nativeElement;
        const rect = viewport?.getBoundingClientRect();
        const left = rect?.left ?? 0;
        const top = rect?.top ?? 0;
        const mx = centerX - left;
        const my = centerY - top;
        // Use zoomAround logic via state
        const screenPoint: Point = { x: mx, y: my };
        this.state.zoomAroundScreenPoint(screenPoint, factor);
      }
      return;
    }

    // 3. Pan
    if (this.isPanning) {
      const dx = event.clientX - this.panStartX;
      const dy = event.clientY - this.panStartY;
      this.state.setViewportXY(this.panStartVx + dx, this.panStartVy + dy);
    }
  }

  @HostListener('window:pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);

    if (this.pinchActive && this.pointers.size < 2) {
      this.pinchActive = false;
    }

    if (this.draggingId && event.pointerId === this.dragPointerId) {
      const target = document.querySelector(
        `[data-panel-id="${this.draggingId}"]`
      ) as HTMLElement | null;
      target?.classList.remove('dragging');
      this.draggingId = null;
      this.dragPointerId = null;
    }

    if (this.isPanning) {
      this.isPanning = false;
      const viewport = this.viewportRef()?.nativeElement;
      if (viewport) viewport.classList.remove('panning');
    }
  }

  @HostListener('window:pointercancel', ['$event'])
  onPointerCancel(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);

    if (this.draggingId && event.pointerId === this.dragPointerId) {
      const target = document.querySelector(
        `[data-panel-id="${this.draggingId}"]`
      ) as HTMLElement | null;
      target?.classList.remove('dragging');
      this.draggingId = null;
      this.dragPointerId = null;
    }

    if (this.isPanning) {
      this.isPanning = false;
      const viewport = this.viewportRef()?.nativeElement;
      if (viewport) viewport.classList.remove('panning');
    }
    if (this.pinchActive) this.pinchActive = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = -Math.sign(event.deltaY) * (event.deltaMode === 1 ? 0.08 : 0.02);
    const factor = 1 + delta;
    const rect = this.viewportRef()?.nativeElement?.getBoundingClientRect();
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    const screenPoint: Point = { x: event.clientX - left, y: event.clientY - top };
    this.state.zoomAroundScreenPoint(screenPoint, factor);
  }

  recenter(): void {
    this.state.recenter();
  }

  resetLayout(): void {
    this.state.resetLayout();
  }

  onPanelKeydown(panelId: string, event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ': {
        event.preventDefault();
        this.centerPanel(panelId);
        break;
      }
      case 'ArrowUp':
        event.preventDefault();
        this.state.setViewportXY(this.viewportX(), this.viewportY() + 50);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.state.setViewportXY(this.viewportX(), this.viewportY() - 50);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.state.setViewportXY(this.viewportX() + 50, this.viewportY());
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.state.setViewportXY(this.viewportX() - 50, this.viewportY());
        break;
      case 'PageUp':
        event.preventDefault();
        this.state.setViewportXY(this.viewportX(), this.viewportY() + 200);
        break;
      case 'PageDown':
        event.preventDefault();
        this.state.setViewportXY(this.viewportX(), this.viewportY() - 200);
        break;
      case 'Home':
        event.preventDefault();
        this.recenter();
        break;
      case 'Escape': {
        // Clear focus
        (event.target as HTMLElement).blur();
        break;
      }
    }
  }

  private centerPanel(panelId: string): void {
    const panel = this.panels().find((p) => p.id === panelId);
    if (!panel) return;

    const viewport = this.viewportRef()?.nativeElement;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;

    // Center panel in screen space (accounting for zoom)
    const targetX = vw / 2 - (panel.x * this.zoom());
    const targetY = vh / 2 - (panel.y * this.zoom());
    this.state.setViewportXY(targetX, targetY);
    this.state.bringToFront(panelId);

    // Focus panel
    const el = document.querySelector(`[data-panel-id="${panelId}"]`) as HTMLElement | null;
    el?.focus();
  }

  onPanelFocus(panelId: string): void {
    const el = document.querySelector(`[data-panel-id="${panelId}"]`) as HTMLElement | null;
    el?.classList.add('focused');
  }

  onPanelBlur(panelId: string): void {
    const el = document.querySelector(`[data-panel-id="${panelId}"]`) as HTMLElement | null;
    el?.classList.remove('focused');
  }
}
