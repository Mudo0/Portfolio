import { Component, computed, inject, signal } from '@angular/core';
import { CanvasComponent } from './features/canvas/canvas.component';
import { SimpleLayoutComponent } from './features/simple/simple-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CanvasComponent, SimpleLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly _isMobile = signal(this.checkIsMobile());

  readonly isMobile = computed(() => this._isMobile());

  constructor() {
    // Update on resize (debounce not necessary for breakpoint)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this._isMobile.set(this.checkIsMobile());
      });
    }
  }

  private checkIsMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }
}
