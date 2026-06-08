import { Component, signal } from '@angular/core';

@Component({
  selector: 'sp-remove-liquidity',
  standalone: true,
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Remove Liquidity</h2>
        <div class="space-y-3">
          <label class="text-sm text-surface-400">Amount to Remove</label>
          <input type="range" min="0" max="100" [value]="percentage()" (input)="percentage.set(+$any($event.target).value)"
            class="w-full accent-primary" />
          <div class="flex gap-2">
            @for (p of [25, 50, 75, 100]; track p) {
              <button (click)="percentage.set(p)" [class]="percentage() === p ? 'bg-primary text-black' : 'bg-surface-700'"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors">{{ p }}%</button>
            }
          </div>
        </div>
        <button class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors">
          Remove Liquidity
        </button>
      </div>
    </div>
  `,
})
export class RemoveLiquidityComponent {
  percentage = signal(50);
}
