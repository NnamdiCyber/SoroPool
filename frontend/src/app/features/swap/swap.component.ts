import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { TokenAmountInputComponent } from '../../shared/components/token-amount-input/token-amount-input.component';
import { PriceImpactBadgeComponent } from '../../shared/components/price-impact-badge/price-impact-badge.component';
import { RouteDisplayComponent } from './route-display/route-display.component';
import { SwapSettingsComponent } from './swap-settings/swap-settings.component';
import { PriceImpactWarningComponent } from './price-impact-warning/price-impact-warning.component';
import { TokenSelectorComponent, TokenOption } from '../../shared/components/token-selector/token-selector.component';
import { TxConfirmModalComponent, TxStep } from '../../shared/components/tx-confirm-modal/tx-confirm-modal.component';
import { WalletService } from '../../core/services/wallet.service';
import { StellarService } from '../../core/services/stellar.service';
import { SwapActions } from '../../core/store/swap/swap.actions';
import { selectSwapQuote, selectSwapRoute, selectMinAmountOut, selectPriceImpactSeverity, selectSlippageTolerance } from '../../core/store/swap/swap.selectors';

@Component({
  selector: 'sp-swap',
  standalone: true,
  imports: [
    FormsModule,
    TokenAmountInputComponent,
    PriceImpactBadgeComponent,
    RouteDisplayComponent,
    SwapSettingsComponent,
    PriceImpactWarningComponent,
    TokenSelectorComponent,
    TxConfirmModalComponent,
  ],
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">Swap</h2>
          <button (click)="showSettings.set(!showSettings())" class="p-2 rounded-lg hover:bg-surface-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        @if (showSettings()) {
          <div class="mb-4">
            <sp-swap-settings
              [slippage]="slippage()"
              [deadline]="deadline()"
              (slippageChange)="onSlippageChange($event)"
              (deadlineChange)="onDeadlineChange($event)"
            />
          </div>
        }

        <div class="space-y-1">
          <sp-token-amount-input
            label="You Pay"
            [tokenSymbol]="tokenInSymbol()"
            [amount]="amountIn()"
            [balance]="tokenInBalance()"
            (amountChange)="onAmountInChange($event)"
            (tokenClick)="openTokenSelector('in')"
          />
          <div class="flex justify-center -my-2 relative z-10">
            <button (click)="reverseTokens()" class="p-2 rounded-full bg-surface-700 hover:bg-surface-600 transition-colors border-4 border-surface-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          <sp-token-amount-input
            label="You Receive"
            [tokenSymbol]="tokenOutSymbol()"
            [amount]="quote()?.amountOut || ''"
            (tokenClick)="openTokenSelector('out')"
          />
        </div>

        @if (quote()) {
          <div class="mt-4 p-3 bg-surface-900 rounded-xl space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-surface-400">Price Impact</span>
              <sp-price-impact-badge
                [impact]="quote()!.priceImpact"
                [severity]="priceImpactSeverity()"
              />
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">Min Received</span>
              <span class="font-medium">{{ minAmountOutFormatted() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">Slippage</span>
              <span class="font-medium">{{ slippage() * 100 }}%</span>
            </div>
            @if (quote()!.route?.pools?.length) {
              <div class="flex justify-between items-center">
                <span class="text-surface-400">Route</span>
                <sp-route-display [route]="quote()!.route" />
              </div>
            }
          </div>
        }

        @if (priceImpactSeverity() === 'high' || priceImpactSeverity() === 'critical') {
          <sp-price-impact-warning
            [visible]="showPriceImpactWarning()"
            (confirm)="showPriceImpactWarning.set(false)"
          />
        }

        <button
          (click)="executeSwap()"
          [disabled]="!walletService.isConnected() || !amountIn() || !quote()"
          class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (!walletService.isConnected()) {
            Connect Wallet
          } @else if (!amountIn()) {
            Enter Amount
          } @else if (!quote()) {
            Fetching Quote...
          } @else {
            Swap
          }
        </button>
      </div>
    </div>

    <sp-token-selector
      [open]="tokenSelectorOpen()"
      [tokens]="knownTokens()"
      (close)="tokenSelectorOpen.set(false)"
      (select)="onTokenSelect($event)"
    />

    <sp-tx-confirm-modal
      [open]="txModalOpen()"
      [step]="txStep()"
      [details]="txDetails()"
      [txHash]="txHash()"
      [errorMessage]="txError()"
      (cancel)="txModalOpen.set(false)"
      (confirm)="confirmSwap()"
      (dismiss)="txModalOpen.set(false)"
      (retry)="retrySwap()"
    />
  `,
})
export class SwapComponent {
  private store = inject(Store);
  walletService = inject(WalletService);
  private stellarService = inject(StellarService);

  amountIn = signal('');
  tokenInSymbol = signal('XLM');
  tokenOutSymbol = signal('USDC');
  tokenInBalance = signal('');
  showSettings = signal(false);
  showPriceImpactWarning = signal(true);
  deadline = signal(30);

  tokenSelectorOpen = signal(false);
  tokenSelectorMode = signal<'in' | 'out'>('in');
  knownTokens = signal<TokenOption[]>([
    { symbol: 'XLM', name: 'Stellar Lumens', contractAddress: 'native', decimals: 7 },
    { symbol: 'USDC', name: 'USD Coin', contractAddress: 'usdc-contract', decimals: 7 },
    { symbol: 'USDT', name: 'Tether USD', contractAddress: 'usdt-contract', decimals: 7 },
    { symbol: 'BTC', name: 'Bitcoin', contractAddress: 'btc-contract', decimals: 7 },
    { symbol: 'ETH', name: 'Ethereum', contractAddress: 'eth-contract', decimals: 7 },
  ]);

  txModalOpen = signal(false);
  txStep = signal<TxStep>('review');
  txHash = signal('');
  txError = signal('');
  txDetails = signal<{ label: string; value: string }[]>([]);

  quote = this.store.selectSignal(selectSwapQuote);
  route = this.store.selectSignal(selectSwapRoute);
  minAmountOut = this.store.selectSignal(selectMinAmountOut);
  priceImpactSeverity = this.store.selectSignal(selectPriceImpactSeverity);
  slippage = this.store.selectSignal(selectSlippageTolerance);

  minAmountOutFormatted = () => {
    const val = this.minAmountOut();
    return val ? (Number(val) / 1e7).toFixed(4) : '0';
  };

  onAmountInChange(amount: string) {
    this.amountIn.set(amount);
    this.store.dispatch(SwapActions.setAmountIn({ amount }));
    if (amount && this.tokenInSymbol() && this.tokenOutSymbol()) {
      this.store.dispatch(SwapActions.getQuote({
        tokenIn: this.tokenInSymbol(),
        tokenOut: this.tokenOutSymbol(),
        amountIn: amount,
      }));
    }
  }

  onSlippageChange(slippage: number) {
    this.store.dispatch(SwapActions.setSlippage({ slippage }));
  }

  onDeadlineChange(deadline: number) {
    this.deadline.set(deadline);
    this.store.dispatch(SwapActions.setDeadline({ deadline }));
  }

  reverseTokens() {
    const tempIn = this.tokenInSymbol();
    const tempOut = this.tokenOutSymbol();
    this.tokenInSymbol.set(tempOut);
    this.tokenOutSymbol.set(tempIn);
    this.store.dispatch(SwapActions.setTokenIn({ token: tempOut }));
    this.store.dispatch(SwapActions.setTokenOut({ token: tempIn }));
    if (this.amountIn()) {
      this.store.dispatch(SwapActions.getQuote({
        tokenIn: tempOut,
        tokenOut: tempIn,
        amountIn: this.amountIn(),
      }));
    }
  }

  openTokenSelector(mode: 'in' | 'out') {
    this.tokenSelectorMode.set(mode);
    this.tokenSelectorOpen.set(true);
  }

  onTokenSelect(token: TokenOption) {
    if (this.tokenSelectorMode() === 'in') {
      this.tokenInSymbol.set(token.symbol);
      this.store.dispatch(SwapActions.setTokenIn({ token: token.symbol }));
    } else {
      this.tokenOutSymbol.set(token.symbol);
      this.store.dispatch(SwapActions.setTokenOut({ token: token.symbol }));
    }
    if (this.amountIn()) {
      this.store.dispatch(SwapActions.getQuote({
        tokenIn: this.tokenInSymbol(),
        tokenOut: this.tokenOutSymbol(),
        amountIn: this.amountIn(),
      }));
    }
  }

  async executeSwap() {
    const q = this.quote();
    if (!q) return;

    this.txDetails.set([
      { label: 'You Pay', value: `${this.amountIn()} ${this.tokenInSymbol()}` },
      { label: 'You Receive', value: `${q.amountOut} ${this.tokenOutSymbol()}` },
      { label: 'Price Impact', value: `${(q.priceImpact * 100).toFixed(2)}%` },
      { label: 'Minimum Received', value: `${this.minAmountOutFormatted()} ${this.tokenOutSymbol()}` },
    ]);
    this.txStep.set('review');
    this.txModalOpen.set(true);
  }

  async confirmSwap() {
    this.txStep.set('signing');
    try {
      const tokenIn = this.tokenInSymbol();
      const amountIn = this.amountIn();
      const tokenOut = this.tokenOutSymbol();
      const q = this.quote();

      const signedXdr = await this.walletService.signTransaction('placeholder-xdr');
      this.txStep.set('submitted');
      this.txHash.set('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      this.store.dispatch(SwapActions.resetSwap());
      this.amountIn.set('');
    } catch (err) {
      this.txStep.set('error');
      this.txError.set(err instanceof Error ? err.message : 'Transaction rejected by user');
    }
  }

  retrySwap() {
    this.txStep.set('signing');
    this.confirmSwap();
  }
}
