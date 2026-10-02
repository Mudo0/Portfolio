import { Component } from '@angular/core';

@Component({
  selector: 'app-experience-panel',
  standalone: true,
  template: `
    <div class="exp">
      <h2>Experiencia</h2>
      <p>Experiencia profesional y proyectos relevantes.</p>
      <a href="#" download>Descargar CV (PDF)</a>
    </div>
  `,
  styles: [
    `
      .exp {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      h2 {
        font-size: 20px;
      }
      p {
        color: var(--text-secondary);
      }
      a {
        color: var(--accent);
        margin-top: auto;
      }
    `,
  ],
})
export class ExperiencePanelComponent {}
