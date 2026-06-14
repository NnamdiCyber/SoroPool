import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sp-token-amount-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-surface-800 rounded-xl p-4 border border-surface-700">
      <div class="flex justify-between mb-2">
        <span class="text-xs text-surface-400">{{ label() }}</span>
        @if (balance()) {
          <span class="text-xs text-surface-400">Balance: {{ balance() }}</span>
        }
      </div>
      <div class="flex items-center gap-3">
        <input
          [ngModel]="amount()"
          (ngModelChange)="amountChange.emit($event)"
          type="text"
          inputmode="decimal"
          placeholder="0.0"
          class="flex-1 bg-transparent text-2xl font-semibold outline-none text-white placeholder-surface-500"
        />
        @if (balance()) {
          <button (click)="amountChange.emit(balance())" class="text-xs text-primary font-medium uppercase">Max</button>
        }
        <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 transition-colors">
          <span class="text-sm font-medium">{{ tokenSymbol() || 'Select' }}</span>
        </button>
      </div>
      @if (usdValue()) {
        <div class="mt-1 text-xs text-surface-500">~$<span>{{ usdValue() }}</span></div>
      }
    </div>
  `,
})
export class TokenAmountInputComponent {
  label = input<string>('');
  amount = input<string>('');
  tokenSymbol = input<string>('');
  balance = input<string>('');
  usdValue = input<string>('');
  amountChange = output<string>();
}
