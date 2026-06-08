import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'sp-concentrated-lp',
  standalone: true,
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Concentrated Liquidity</h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs text-surface-400">Min Price</label>
            <input #minPrice type="number" (input)="tickLower.set(+minPrice.value)" class="w-full mt-1 px-3 py-2 rounded-lg bg-surface-700 text-sm outline-none" />
          </div>
          <div>
            <label class="text-xs text-surface-400">Max Price</label>
            <input #maxPrice type="number" (input)="tickUpper.set(+maxPrice.value)" class="w-full mt-1 px-3 py-2 rounded-lg bg-surface-700 text-sm outline-none" />
          </div>
          <div class="text-sm text-surface-300">
            Capital Efficiency: <span class="text-primary font-semibold">{{ capitalEfficiency() }}x</span> vs full range
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConcentratedLpComponent {
  tickLower = signal(-887272);
  tickUpper = signal(887272);

  capitalEfficiency = computed(() => {
    const sqrtRatio = Math.sqrt(
      Math.pow(1.0001, this.tickUpper()) / Math.pow(1.0001, this.tickLower()),
    );
    return (sqrtRatio / (sqrtRatio - 1)).toFixed(1);
  });
}
