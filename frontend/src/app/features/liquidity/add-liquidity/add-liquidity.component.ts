import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TokenAmountInputComponent } from '../../../shared/components/token-amount-input/token-amount-input.component';

@Component({
  selector: 'sp-add-liquidity',
  standalone: true,
  imports: [FormsModule, TokenAmountInputComponent],
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Add Liquidity</h2>
        <div class="space-y-2">
          <sp-token-amount-input label="Token A" [amount]="amountA()" (amountChange)="amountA.set($event)" />
          <sp-token-amount-input label="Token B" [amount]="amountB()" (amountChange)="amountB.set($event)" />
        </div>
        <button class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors">
          Add Liquidity
        </button>
      </div>
    </div>
  `,
})
export class AddLiquidityComponent {
  amountA = signal('');
  amountB = signal('');
}
