import { Component, inject } from '@angular/core';
import { PanelComponent } from '../panels/panel.component';
import { HeroPanelComponent } from '../panels/hero/hero-panel.component';
import { ProjectsPanelComponent } from '../panels/projects/projects-panel.component';
import { AboutPanelComponent } from '../panels/about/about-panel.component';
import { ExperiencePanelComponent } from '../panels/experience/experience-panel.component';
import { ContactPanelComponent } from '../panels/contact/contact-panel.component';
import { CanvasStateService } from '../../core/services/canvas-state.service';

@Component({
  selector: 'app-simple-layout',
  standalone: true,
  imports: [
    PanelComponent,
    HeroPanelComponent,
    ProjectsPanelComponent,
    AboutPanelComponent,
    ExperiencePanelComponent,
    ContactPanelComponent,
  ],
  templateUrl: './simple-layout.component.html',
  styleUrl: './simple-layout.component.scss',
})
export class SimpleLayoutComponent {
  private readonly state = inject(CanvasStateService);
  readonly panels = this.state.panels;
}
