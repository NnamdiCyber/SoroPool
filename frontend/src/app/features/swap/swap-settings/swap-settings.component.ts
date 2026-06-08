import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sp-swap-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-4 bg-surface-800 rounded-xl border border-surface-700">
      <h3 class="text-sm font-semibold mb-3">Swap Settings</h3>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-surface-400">Slippage Tolerance</label>
          <div class="flex gap-2 mt-1">
            @for (opt of [0.001, 0.005, 0.01]; track opt) {
              <button (click)="slippage.set(opt)" [class]="slippage() === opt ? 'bg-primary text-black' : 'bg-surface-700'"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                {{ opt * 100 }}%
              </button>
            }
          </div>
        </div>
        <div>
          <label class="text-xs text-surface-400">Deadline (minutes)</label>
          <input [(ngModel)]="deadline" type="number" class="w-full mt-1 px-3 py-1.5 rounded-lg bg-surface-700 text-sm outline-none" />
        </div>
      </div>
    </div>
  `,
})
export class SwapSettingsComponent {
  slippage = signal(0.005);
  deadline = 30;
}
