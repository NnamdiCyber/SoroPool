import { Component, input } from '@angular/core';

@Component({
  selector: 'sp-route-display',
  standalone: true,
  template: `
    <div class="flex items-center gap-2 text-xs">
      @for (step of route()?.steps || []; track $index) {
        <span class="px-2 py-1 rounded bg-surface-700">{{ step.pool }}</span>
        @if (!$last) {
          <span class="text-surface-500">→</span>
        }
      }
    </div>
  `,
})
export class RouteDisplayComponent {
  route = input<any>(null);
}
