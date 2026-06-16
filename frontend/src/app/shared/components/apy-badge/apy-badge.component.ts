import { Component, input } from '@angular/core';

@Component({
  selector: 'sp-apy-badge',
  standalone: true,
  template: `
    <span [class]="badgeClass()" class="px-2 py-0.5 rounded text-xs font-medium">
      {{ apy() }}% APY
    </span>
  `,
})
export class ApyBadgeComponent {
  apy = input<number>(0);

  badgeClass() {
    const apy = this.apy();
    if (apy >= 50) return 'bg-green-900/50 text-green-400';
    if (apy >= 20) return 'bg-emerald-900/50 text-emerald-400';
    if (apy >= 10) return 'bg-yellow-900/50 text-yellow-400';
    return 'bg-surface-600 text-surface-300';
  }
}
