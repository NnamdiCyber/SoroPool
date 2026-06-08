import { Component } from '@angular/core';

@Component({
  selector: 'sp-analytics',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto mt-8 px-4">
      <h2 class="text-xl font-bold mb-6">Analytics</h2>
      <p class="text-surface-400">Protocol-wide analytics and statistics.</p>
    </div>
  `,
})
export class AnalyticsComponent {}
