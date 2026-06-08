import { Component, input, output } from '@angular/core';

@Component({
  selector: 'sp-price-impact-warning',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
        <p class="text-sm text-red-400 font-medium">High Price Impact</p>
        <p class="text-xs text-red-400/70 mt-1">The price impact is very high. Consider reducing your swap amount.</p>
        <button (click)="confirm.emit()" class="mt-2 px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium">Swap Anyway</button>
      </div>
    }
  `,
})
export class PriceImpactWarningComponent {
  visible = input(false);
  confirm = output<void>();
}
