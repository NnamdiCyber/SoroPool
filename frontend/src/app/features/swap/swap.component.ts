import { Component, inject, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { TokenAmountInputComponent } from '../../shared/components/token-amount-input/token-amount-input.component';
import { PriceImpactBadgeComponent } from '../../shared/components/price-impact-badge/price-impact-badge.component';
import { WalletService } from '../../core/services/wallet.service';
import { SwapActions } from '../../core/store/swap/swap.actions';
import { selectSwapQuote, selectMinAmountOut, selectPriceImpactSeverity, selectSlippageTolerance } from '../../core/store/swap/swap.selectors';

@Component({
  selector: 'sp-swap',
  standalone: true,
  imports: [FormsModule, TokenAmountInputComponent, PriceImpactBadgeComponent],
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Swap</h2>

        <div class="space-y-2">
          <sp-token-amount-input
            label="You Pay"
            [amount]="amountIn()"
            (amountChange)="onAmountInChange($event)"
          />
          <div class="flex justify-center">
            <button class="p-2 rounded-full bg-surface-700 hover:bg-surface-600 transition-colors">&#8595;</button>
          </div>
          <sp-token-amount-input
            label="You Receive"
            [amount]="quote()?.amountOut || ''"
          />
        </div>

        <div class="mt-4 p-3 bg-surface-900 rounded-xl space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-surface-400">Price Impact</span>
            <sp-price-impact-badge
              [impact]="quote()?.priceImpact || 0"
              [severity]="priceImpactSeverity()"
            />
          </div>
          <div class="flex justify-between">
            <span class="text-surface-400">Min Received</span>
            <span class="font-medium">{{ minAmountOut() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-surface-400">Slippage</span>
            <span class="font-medium">{{ slippage() * 100 }}%</span>
          </div>
        </div>

        <button
          (click)="executeSwap()"
          [disabled]="!walletService.isConnected() || !amountIn()"
          class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ walletService.isConnected() ? 'Swap' : 'Connect Wallet' }}
        </button>
      </div>
    </div>
  `,
})
export class SwapComponent {
  private store = inject(Store);
  walletService = inject(WalletService);

  amountIn = signal('');
  quote = this.store.selectSignal(selectSwapQuote);
  minAmountOut = this.store.selectSignal(selectMinAmountOut);
  priceImpactSeverity = this.store.selectSignal(selectPriceImpactSeverity);
  slippage = this.store.selectSignal(selectSlippageTolerance);

  onAmountInChange(amount: string) {
    this.amountIn.set(amount);
    this.store.dispatch(SwapActions.setAmountIn({ amount }));
    if (amount) {
      this.store.dispatch(SwapActions.getQuote());
    }
  }

  async executeSwap() {
    // Build tx, sign, submit
  }
}
