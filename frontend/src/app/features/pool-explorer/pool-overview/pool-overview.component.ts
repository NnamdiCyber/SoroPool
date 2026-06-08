import { Component } from '@angular/core';

@Component({
  selector: 'sp-pool-overview',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto mt-8 px-4">
      <h2 class="text-xl font-bold mb-6">Pool Explorer</h2>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-surface-800 rounded-xl p-4 border border-surface-700">
          <p class="text-xs text-surface-400">TVL</p>
          <p class="text-lg font-bold">$0</p>
        </div>
        <div class="bg-surface-800 rounded-xl p-4 border border-surface-700">
          <p class="text-xs text-surface-400">Volume 24h</p>
          <p class="text-lg font-bold">$0</p>
        </div>
        <div class="bg-surface-800 rounded-xl p-4 border border-surface-700">
          <p class="text-xs text-surface-400">Fees 24h</p>
          <p class="text-lg font-bold">$0</p>
        </div>
      </div>
    </div>
  `,
})
export class PoolOverviewComponent {}
