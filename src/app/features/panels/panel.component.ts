import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
  host: {
    '[style.left.px]': 'x()',
    '[style.top.px]': 'y()',
    '[style.zIndex]': 'zIndex()',
    '[style.transform]': 'computedTransform()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-panel-id]': 'id()',
    role: 'region',
    tabindex: '0',
    class: 'app-panel',
  },
})
export class PanelComponent {
  readonly id = input.required<string>();
  readonly x = input(0);
  readonly y = input(0);
  readonly zIndex = input(1);
  readonly rotation = input(0);
  readonly ariaLabel = input<string>('Panel');
  readonly customTransform = input<string | null>(null);

  readonly computedTransform = computed(() => {
    const custom = this.customTransform();
    if (custom) return custom;
    const r = this.rotation();
    return `rotate(${r}deg)`;
  });
}
