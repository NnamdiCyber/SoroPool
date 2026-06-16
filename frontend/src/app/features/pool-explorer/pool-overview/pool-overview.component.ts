import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { PoolActions } from '../../../core/store/pools/pools.actions';
import { selectAllPools } from '../../../core/store/pools/pools.selectors';
import { ApyBadgeComponent } from '../../../shared/components/apy-badge/apy-badge.component';

@Component({
  selector: 'sp-pool-overview',
  standalone: true,
  imports: [RouterLink, ApyBadgeComponent],
  template: `
    <div class="max-w-5xl mx-auto mt-8 px-4">
      @if (poolId()) {
        <div class="mb-4">
          <a routerLink="/pool-explorer" class="text-sm text-primary hover:underline">&larr; Back to Pools</a>
        </div>
      }

      @if (pool()) {
        <div class="bg-surface-800 rounded-2xl border border-surface-700 p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold">{{ pool()!.token0?.symbol || '?' }}/{{ pool()!.token1?.symbol || '?' }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs bg-surface-700 px-2 py-0.5 rounded">{{ formatPoolType(pool()!.poolType) }}</span>
                <span class="text-xs text-surface-400">{{ (pool()!.feeBps || 0) / 100 }}% fee</span>
                <sp-apy-badge [apy]="estimatedApy()" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-900 rounded-xl p-4">
              <p class="text-xs text-surface-400">TVL</p>
              <p class="text-lg font-bold mt-1"><span>$</span>{{ formatNumber(pool()!.tvlUsd) }}</p>
            </div>
            <div class="bg-surface-900 rounded-xl p-4">
              <p class="text-xs text-surface-400">Volume 24h</p>
              <p class="text-lg font-bold mt-1"><span>$</span>{{ formatNumber(pool()!.volume24hUsd) }}</p>
            </div>
            <div class="bg-surface-900 rounded-xl p-4">
              <p class="text-xs text-surface-400">Fees 24h</p>
              <p class="text-lg font-bold mt-1"><span>$</span>{{ formatNumber(pool()!.feeRevenue24h) }}</p>
            </div>
            <div class="bg-surface-900 rounded-xl p-4">
              <p class="text-xs text-surface-400">Liquidity Providers</p>
              <p class="text-lg font-bold mt-1">{{ pool()!.lpCount || 0 }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-surface-900 rounded-xl p-4">
              <p class="text-xs text-surface-400">Reserve {{ pool()!.token0?.symbol || 'Token 0' }}</p>
              <p class="text-lg font-bold mt-1">{{ formatReserve(pool()!.reserve0) }}</p>
            </div>
            <div class="bg-surface-900 rounded-xl p-4">
              <p class="text-xs text-surface-400">Reserve {{ pool()!.token1?.symbol || 'Token 1' }}</p>
              <p class="text-lg font-bold mt-1">{{ formatReserve(pool()!.reserve1) }}</p>
            </div>
          </div>

          <div class="bg-surface-900 rounded-xl p-4">
            <p class="text-xs text-surface-400 mb-2">Reserve Ratio</p>
            <div class="h-4 bg-surface-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all"
                [style.width.%]="reserveRatio()"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-surface-400 mt-1">
              <span>{{ pool()!.token0?.symbol || 'Token 0' }}: {{ reserveRatio().toFixed(1) }}%</span>
              <span>{{ pool()!.token1?.symbol || 'Token 1' }}: {{ (100 - reserveRatio()).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      } @else if (!poolId()) {
        <div>
          <h2 class="text-xl font-bold mb-6">Pool Explorer</h2>
          @if (loading()) {
            <div class="text-center py-12 text-surface-400">Loading pools...</div>
          } @else if (allPools().length === 0) {
            <div class="text-center py-12 text-surface-400">No pools available yet</div>
          } @else {
            <div class="grid gap-4 md:grid-cols-2">
              @for (pool of allPools(); track pool.id) {
                <a [routerLink]="['/pool-explorer', pool.id]" class="block bg-surface-800 rounded-xl border border-surface-700 p-5 hover:border-surface-600 transition-colors">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold">{{ pool.token0?.symbol || '?' }}/{{ pool.token1?.symbol || '?' }}</h3>
                    <div class="flex items-center gap-2">
                      <span class="text-xs bg-surface-700 px-2 py-0.5 rounded">{{ formatPoolType(pool.poolType) }}</span>
                      <sp-apy-badge [apy]="estimateApy(pool)" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs text-surface-400">TVL</p>
                      <p class="font-medium"><span>$</span>{{ formatNumber(pool.tvlUsd) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-surface-400">Volume 24h</p>
                      <p class="font-medium"><span>$</span>{{ formatNumber(pool.volume24hUsd) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-surface-400">Fee Tier</p>
                      <p class="font-medium">{{ (pool.feeBps || 0) / 100 }}%</p>
                    </div>
                    <div>
                      <p class="text-xs text-surface-400">LPs</p>
                      <p class="font-medium">{{ pool.lpCount || 0 }}</p>
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PoolOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);

  poolId = signal<string | null>(null);
  loading = signal(false);
  allPools = this.store.selectSignal(selectAllPools);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('poolId');
    if (id) {
      this.poolId.set(id);
    }
    this.store.dispatch(PoolActions.loadPools());
  }

  pool() {
    const id = this.poolId();
    if (!id) return null;
    return this.allPools().find((p) => p.id === id) || null;
  }

  reserveRatio(): number {
    const p = this.pool();
    if (!p) return 50;
    const r0 = Number(p.reserve0 || 0);
    const r1 = Number(p.reserve1 || 0);
    const total = r0 + r1;
    return total > 0 ? (r0 / total) * 100 : 50;
  }

  estimateApy(pool: any): number {
    const vol = Number(pool.volume24hUsd || 0);
    const tvl = Number(pool.tvlUsd || 0);
    if (tvl <= 0) return 0;
    const feeBps = (pool.feeBps || 30) / 10000;
    const dailyFees = vol * feeBps;
    return ((dailyFees * 365) / tvl) * 100;
  }

  estimatedApy(): number {
    return this.estimateApy(this.pool());
  }

  formatNumber(val: string | number): string {
    const num = Number(val || 0);
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  formatReserve(val: string | number): string {
    const num = Number(val || 0);
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(4);
  }

  formatPoolType(type: string): string {
    const map: Record<string, string> = {
      constant_product: 'CP',
      stableswap: 'Stable',
      concentrated: 'CL',
    };
    return map[type] || type;
  }
}
