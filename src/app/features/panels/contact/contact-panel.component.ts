import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-contact-panel',
  standalone: true,
  template: `
    <div class="contact">
      <h2>Contacto</h2>
      <div class="item">
        <span>Email</span>
        <a href="mailto:hello@mateo.dev">hello@mateo.dev</a>
        <button type="button" (click)="copyEmail()" [aria-label]="'Copiar email'">
          {{ copied() ? 'Copiado' : 'Copiar' }}
        </button>
      </div>
      <div class="item">
        <span>Teléfono</span>
        <a href="tel:+5491123456789">+54 9 11 2345-6789</a>
      </div>
      <p class="note">
        Sin formulario. Compatible con Cloudflare Email Obfuscation (Fase 4).
      </p>
    </div>
  `,
  styles: [
    `
      .contact {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      h2 {
        font-size: 20px;
      }
      .item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      span {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        opacity: 0.8;
      }
      button {
        align-self: flex-start;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--border);
        color: var(--text-primary);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
      }
      button:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .note {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: auto;
      }
    `,
  ],
})
export class ContactPanelComponent {
  readonly copied = signal(false);

  async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText('hello@mateo.dev');
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1200);
    } catch {
      // Silently ignore
    }
  }
}
