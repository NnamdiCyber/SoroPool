import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TokenAmountInputComponent } from '../../../shared/components/token-amount-input/token-amount-input.component';
import { TxConfirmModalComponent, TxStep } from '../../../shared/components/tx-confirm-modal/tx-confirm-modal.component';
import { WalletService } from '../../../core/services/wallet.service';
import { selectAllPools } from '../../../core/store/pools/pools.selectors';
import { PoolActions } from '../../../core/store/pools/pools.actions';

@Component({
  selector: 'sp-remove-liquidity',
  standalone: true,
  imports: [
    FormsModule,
    TokenAmountInputComponent,
    TxConfirmModalComponent,
    RouterLink,
  ],
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="mb-4">
        <a routerLink="/liquidity" class="text-sm text-primary hover:underline">&larr; Back to Pools</a>
      </div>

      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Remove Liquidity</h2>

        <div class="mb-4 p-3 bg-surface-900 rounded-xl text-sm">
          <div class="flex items-center justify-between">
            <span class="text-surface-400">Pool</span>
            <span class="font-medium">{{ poolName() }}</span>
          </div>
        </div>

        <div class="mb-4 p-3 bg-surface-900 rounded-xl text-sm">
          <div class="flex justify-between">
            <span class="text-surface-400">Your LP Balance</span>
            <span class="font-medium">{{ lpBalanceFormatted() }}</span>
          </div>
        </div>

        <div class="space-y-3">
          <label class="text-sm text-surface-400">Amount to Remove</label>
          <input type="range" min="0" max="100" [value]="percentage()" (input)="percentage.set(+$any($event.target).value)"
            class="w-full accent-primary" />
          <div class="flex gap-2">
            @for (p of [25, 50, 75, 100]; track p) {
              <button (click)="percentage.set(p)" [class]="percentage() === p ? 'bg-primary text-black' : 'bg-surface-700'"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors">{{ p }}%</button>
            }
          </div>
        </div>

        @if (previewA() > 0 || previewB() > 0) {
          <div class="mt-4 p-3 bg-surface-900 rounded-xl space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-surface-400">You'll Receive</span>
            </div>
            <div class="flex justify-between pl-2">
              <span class="text-surface-400">{{ poolToken0Symbol() || 'Token A' }}</span>
              <span class="font-medium">{{ previewFormattedA() }}</span>
            </div>
            <div class="flex justify-between pl-2">
              <span class="text-surface-400">{{ poolToken1Symbol() || 'Token B' }}</span>
              <span class="font-medium">{{ previewFormattedB() }}</span>
            </div>
          </div>
        }

        <button
          (click)="previewRemoveLiquidity()"
          [disabled]="!percentage() || !walletService.isConnected()"
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
      (confirm)="confirmRemoveLiquidity()"
      (dismiss)="txModalOpen.set(false)"
      (retry)="retryRemoveLiquidity()"
    />
  `,
})
export class RemoveLiquidityComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  walletService = inject(WalletService);

  poolId = signal('');
  percentage = signal(50);

  allPools = this.store.selectSignal(selectAllPools);

  txModalOpen = signal(false);
  txStep = signal<TxStep>('review');
  txHash = signal('');
  txError = signal('');
  txDetails = signal<{ label: string; value: string }[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('poolId');
    if (id) this.poolId.set(id);
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

  lpBalanceFormatted(): string {
    return '1,000.00';
  }

  previewA = computed(() => {
    const p = this.pool();
    if (!p) return 0;
    const r0 = Number(p.reserve0 || 0);
    return r0 * (this.percentage() / 100);
  });

  previewB = computed(() => {
    const p = this.pool();
    if (!p) return 0;
    const r1 = Number(p.reserve1 || 0);
    return r1 * (this.percentage() / 100);
  });

  previewFormattedA() {
    return this.previewA().toFixed(4);
  }

  previewFormattedB() {
    return this.previewB().toFixed(4);
  }

  previewRemoveLiquidity() {
    const p = this.pool();
    if (!p) return;

    this.txDetails.set([
      { label: 'Pool', value: this.poolName() },
      { label: 'Percentage', value: `${this.percentage()}%` },
      { label: `${p.token0?.symbol || 'Token A'} to Receive`, value: `${this.previewFormattedA()}` },
      { label: `${p.token1?.symbol || 'Token B'} to Receive`, value: `${this.previewFormattedB()}` },
    ]);
    this.txStep.set('review');
    this.txModalOpen.set(true);
  }

  async confirmRemoveLiquidity() {
    this.txStep.set('signing');
    try {
      await this.walletService.signTransaction('placeholder-remove-xdr');
      this.txStep.set('submitted');
      this.txHash.set('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    } catch (err) {
      this.txStep.set('error');
      this.txError.set(err instanceof Error ? err.message : 'Transaction rejected');
    }
  }

  retryRemoveLiquidity() {
    this.txStep.set('signing');
    this.confirmRemoveLiquidity();
  }
}
