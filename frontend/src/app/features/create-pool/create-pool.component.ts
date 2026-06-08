import { Component } from '@angular/core';

@Component({
  selector: 'sp-create-pool',
  standalone: true,
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Create Pool</h2>
        <p class="text-sm text-surface-400">Create a new liquidity pool permissionlessly.</p>
        <button class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors">
          Create Pool
        </button>
      </div>
    </div>
  `,
})
export class CreatePoolComponent {}
