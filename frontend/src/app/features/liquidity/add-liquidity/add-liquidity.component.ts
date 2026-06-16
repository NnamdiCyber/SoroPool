import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TokenAmountInputComponent } from '../../../shared/components/token-amount-input/token-amount-input.component';
import { PriceImpactBadgeComponent } from '../../../shared/components/price-impact-badge/price-impact-badge.component';
import { TokenSelectorComponent, TokenOption } from '../../../shared/components/token-selector/token-selector.component';
import { TxConfirmModalComponent, TxStep } from '../../../shared/components/tx-confirm-modal/tx-confirm-modal.component';
import { WalletService } from '../../../core/services/wallet.service';
import { selectAllPools } from '../../../core/store/pools/pools.selectors';
import { PoolActions } from '../../../core/store/pools/pools.actions';

@Component({
  selector: 'sp-add-liquidity',
  standalone: true,
  imports: [
    FormsModule,
    TokenAmountInputComponent,
    PriceImpactBadgeComponent,
    TokenSelectorComponent,
    TxConfirmModalComponent,
    RouterLink,
  ],
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="mb-4">
        <a routerLink="/liquidity" class="text-sm text-primary hover:underline">&larr; Back to Pools</a>
      </div>

      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Add Liquidity</h2>

        <div class="mb-4 p-3 bg-surface-900 rounded-xl text-sm">
          <div class="flex items-center justify-between">
            <span class="text-surface-400">Pool</span>
            <span class="font-medium">{{ poolName() }}</span>
          </div>
          @if (pool()) {
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs bg-surface-700 px-2 py-0.5 rounded">{{ formatPoolType(pool()!.poolType) }}</span>
              <span class="text-xs text-surface-400">{{ (pool()!.feeBps || 0) / 100 }}% fee</span>
            </div>
          }
        </div>

        <div class="space-y-2">
          <sp-token-amount-input
            label="Token A"
            [tokenSymbol]="poolToken0Symbol()"
            [amount]="amountA()"
            (amountChange)="onAmountAChange($event)"
          />
          <sp-token-amount-input
            label="Token B"
            [tokenSymbol]="poolToken1Symbol()"
            [amount]="amountB()"
            (amountChange)="onAmountBChange($event)"
          />
        </div>

        @if (lpTokensPreview() > 0) {
          <div class="mt-4 p-3 bg-surface-900 rounded-xl space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-surface-400">Estimated LP Tokens</span>
              <span class="font-medium">{{ lpTokensPreviewFormatted() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">Share of Pool</span>
              <span class="font-medium">{{ shareOfPool() }}%</span>
            </div>
          </div>
        }

        <button
          (click)="previewAddLiquidity()"
          [disabled]="!amountA() || !amountB() || !walletService.isConnected()"
          class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ walletService.isConnected() ? 'Preview' : 'Connect Wallet' }}
        </button>
      </div>
    </div>

    <sp-tx-confirm-modal
      [open]="txModalOpen()"
      [step]="txStep()"
      [details]="txDetails()"
      [txHash]="txHash()"
      [errorMessage]="txError()"
      (cancel)="txModalOpen.set(false)"
      (confirm)="confirmAddLiquidity()"
      (dismiss)="txModalOpen.set(false)"
      (retry)="retryAddLiquidity()"
    />
  `,
})
export class AddLiquidityComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  walletService = inject(WalletService);

  poolId = signal('');
  amountA = signal('');
  amountB = signal('');

  allPools = this.store.selectSignal(selectAllPools);

  txModalOpen = signal(false);
  txStep = signal<TxStep>('review');
  txHash = signal('');
  txError = signal('');
  txDetails = signal<{ label: string; value: string }[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('poolId');
    if (id) {
      this.poolId.set(id);
    }
    this.store.dispatch(PoolActions.loadPools());
  }

  pool() {
    return this.allPools().find((p) => p.id === this.poolId()) || null;
  }

  poolName() {
    const p = this.pool();
    if (!p) return '...';
    return `${p.token0?.symbol || '?'}/${p.token1?.symbol || '?'}`;
  }

  poolToken0Symbol() {
    return this.pool()?.token0?.symbol || '';
  }

  poolToken1Symbol() {
    return this.pool()?.token1?.symbol || '';
  }

  onAmountAChange(amount: string) {
    this.amountA.set(amount);
  }

  onAmountBChange(amount: string) {
    this.amountB.set(amount);
  }

  lpTokensPreview = computed(() => {
    const p = this.pool();
    const aA = Number(this.amountA());
    const aB = Number(this.amountB());
    if (!p || !aA || !aB) return 0;
    const r0 = Number(p.reserve0 || 1);
    const r1 = Number(p.reserve1 || 1);
    const totalSupply = p.lpCount || 1000;
    if (r0 <= 0 || r1 <= 0) {
      return Math.sqrt(aA * aB) - 1000;
    }
    const ratioA = (aA / r0) * totalSupply;
    const ratioB = (aB / r1) * totalSupply;
    return Math.min(ratioA, ratioB);
  });

  lpTokensPreviewFormatted() {
    return this.lpTokensPreview().toFixed(4);
  }

  shareOfPool = computed(() => {
    const preview = this.lpTokensPreview();
    const p = this.pool();
    if (!p || !preview) return '0';
    const totalSupply = (p.lpCount || 1000) + preview;
    return ((preview / totalSupply) * 100).toFixed(2);
  });

  previewAddLiquidity() {
    const p = this.pool();
    if (!p) return;

    this.txDetails.set([
      { label: 'Pool', value: this.poolName() },
      { label: `${p.token0?.symbol || 'Token A'} Deposit`, value: `${this.amountA()} ${p.token0?.symbol || ''}` },
      { label: `${p.token1?.symbol || 'Token B'} Deposit`, value: `${this.amountB()} ${p.token1?.symbol || ''}` },
      { label: 'Estimated LP Tokens', value: this.lpTokensPreviewFormatted() },
      { label: 'Share of Pool', value: `${this.shareOfPool()}%` },
    ]);
    this.txStep.set('review');
    this.txModalOpen.set(true);
  }

  async confirmAddLiquidity() {
    this.txStep.set('signing');
    try {
      await this.walletService.signTransaction('placeholder-liquidity-xdr');
      this.txStep.set('submitted');
      this.txHash.set('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    } catch (err) {
      this.txStep.set('error');
      this.txError.set(err instanceof Error ? err.message : 'Transaction rejected');
    }
  }

  retryAddLiquidity() {
    this.txStep.set('signing');
    this.confirmAddLiquidity();
  }

  formatPoolType(type: string): string {
    const map: Record<string, string> = { constant_product: 'CP', stableswap: 'Stable', concentrated: 'CL' };
    return map[type] || type;
  }
}
