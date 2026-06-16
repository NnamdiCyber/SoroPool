import { Component, input } from '@angular/core';
import { PriceImpactBadgeComponent } from '../../../shared/components/price-impact-badge/price-impact-badge.component';

@Component({
  selector: 'sp-route-display',
  standalone: true,
  imports: [PriceImpactBadgeComponent],
  template: `
    <div class="flex items-center gap-1.5 text-xs flex-wrap justify-end">
      @for (step of route()?.pools || route()?.steps || []; track $index) {
        <span class="px-2 py-1 rounded bg-surface-700 font-medium">
          {{ step.pool || step.poolId || step.tokenIn + '/' + step.tokenOut }}
        </span>
        @if (!$last) {
          <svg class="w-3 h-3 text-surface-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        }
      }
    </div>
  `,
})
export class RouteDisplayComponent {
  route = input<any>(null);
}
