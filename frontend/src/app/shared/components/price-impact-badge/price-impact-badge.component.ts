import { Component, input } from '@angular/core';

@Component({
  selector: 'sp-price-impact-badge',
  standalone: true,
  template: `
    <span [class]="badgeClass()" class="px-2 py-0.5 rounded text-xs font-medium">
      {{ impact() }}%
    </span>
  `,
})
export class PriceImpactBadgeComponent {
  impact = input<number>(0);
  severity = input<'low' | 'medium' | 'high' | 'critical'>('low');

  badgeClass() {
    const map = { low: 'bg-green-900/50 text-green-400', medium: 'bg-yellow-900/50 text-yellow-400', high: 'bg-orange-900/50 text-orange-400', critical: 'bg-red-900/50 text-red-400' };
    return map[this.severity()] || map.low;
  }
}
