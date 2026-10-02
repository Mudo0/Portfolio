import { Component } from '@angular/core';

@Component({
  selector: 'app-projects-panel',
  standalone: true,
  template: `
    <div class="projects">
      <h2>Proyectos</h2>
      <p class="desc">Proyectos seleccionados. Se completarán con contenido real en Fase 6.</p>
      <ul>
        <li>
          <strong>Portfolio</strong>
          <span>Angular 21 • Canvas infinito • Signals</span>
        </li>
        <li>
          <strong>Proyecto 2</strong>
          <span>TypeScript • Clean Architecture</span>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .projects {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      h2 {
        font-size: 20px;
      }
      .desc {
        color: var(--text-secondary);
      }
      ul {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 0;
        padding-left: 20px;
      }
      li {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      span {
        color: var(--text-secondary);
        font-size: 14px;
      }
    `,
  ],
})
export class ProjectsPanelComponent {}
