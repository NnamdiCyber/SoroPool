import { Component } from '@angular/core';

@Component({
  selector: 'sp-farm-list',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto mt-8 px-4">
      <h2 class="text-xl font-bold mb-6">Yield Farms</h2>
      <p class="text-surface-400">Farm your LP tokens to earn SPL emissions.</p>
    </div>
  `,
})
export class FarmListComponent {}
