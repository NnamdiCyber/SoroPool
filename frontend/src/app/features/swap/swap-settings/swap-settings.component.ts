import { Component, input, output, signal } from '@angular/core';
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
              <button (click)="slippageChange.emit(opt)" [class]="slippage() === opt ? 'bg-primary text-black' : 'bg-surface-700'"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                {{ opt * 100 }}%
              </button>
            }
            <input
              [ngModel]="slippage() * 100"
              (ngModelChange)="slippageChange.emit($event / 100)"
              type="number"
              placeholder="Custom"
              class="w-16 px-2 py-1 rounded-lg bg-surface-700 text-xs outline-none text-center"
            />
          </div>
        </div>
        <div>
          <label class="text-xs text-surface-400">Deadline (minutes)</label>
          <input
            [ngModel]="deadline()"
            (ngModelChange)="deadlineChange.emit($event)"
            type="number"
            class="w-full mt-1 px-3 py-1.5 rounded-lg bg-surface-700 text-sm outline-none"
          />
        </div>
      </div>
    </div>
  `,
})
export class SwapSettingsComponent {
  slippage = input(0.005);
  deadline = input(30);
  slippageChange = output<number>();
  deadlineChange = output<number>();
}
