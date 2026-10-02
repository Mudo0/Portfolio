import { Component } from '@angular/core';

@Component({
  selector: 'app-about-panel',
  standalone: true,
  template: `
    <div class="about">
      <h2>Sobre mí</h2>
      <p>
        Desarrollador frontend enfocado a arquitectura limpia, performance y UX minimalista.
        Me gusta pensar en conceptos antes que código.
      </p>
    </div>
  `,
  styles: [
    `
      .about {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      h2 {
        font-size: 20px;
      }
      p {
        color: var(--text-secondary);
        line-height: 1.7;
      }
    `,
  ],
})
export class AboutPanelComponent {}
