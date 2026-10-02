import { Component } from '@angular/core';

@Component({
  selector: 'app-hero-panel',
  standalone: true,
  template: `
    <div class="hero">
      <h1>Mateo</h1>
      <p class="tagline">Frontend Developer — Angular, TypeScript, Clean Architecture</p>
      <div class="links">
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </div>
  `,
  styles: [
    `
      .hero {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
        justify-content: center;
      }
      h1 {
        font-size: clamp(32px, 4vw, 48px);
        font-weight: 700;
      }
      .tagline {
        color: var(--text-secondary);
        font-size: clamp(14px, 2vw, 16px);
        line-height: 1.6;
      }
      .links {
        display: flex;
        gap: 16px;
        margin-top: 8px;
      }
      a {
        color: var(--accent);
      }
    `,
  ],
})
export class HeroPanelComponent {}
