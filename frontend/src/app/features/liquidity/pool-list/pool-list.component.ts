import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { PoolActions } from '../../../core/store/pools/pools.actions';
import { selectAllPools } from '../../../core/store/pools/pools.selectors';

@Component({
  selector: 'sp-pool-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto mt-8 px-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Pools</h2>
        <a routerLink="/create-pool" class="px-4 py-2 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary-400 transition-colors">
          Create Pool
        </a>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-surface-400">Loading pools...</div>
      } @else if (pools().length === 0) {
        <div class="text-center py-12 text-surface-400">No pools available yet</div>
      } @else {
        <div class="bg-surface-800 rounded-xl border border-surface-700 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-surface-900 text-surface-400">
              <tr>
                <th class="text-left p-4">Pool</th>
                <th class="text-right p-4">TVL</th>
                <th class="text-right p-4">Volume 24h</th>
                <th class="text-right p-4">Fee Tier</th>
                <th class="text-right p-4">Type</th>
              </tr>
            </thead>
            <tbody>
              @for (pool of pools(); track pool.id) {
                <tr class="border-t border-surface-700 hover:bg-surface-700/50 cursor-pointer" [routerLink]="['/liquidity/add', pool.id]">
                  <td class="p-4 font-medium">{{ pool.token0?.symbol || '?' }}/{{ pool.token1?.symbol || '?' }}</td>
                  <td class="p-4 text-right">$<span>{{ formatTvl(pool.tvlUsd) }}</span></td>
                  <td class="p-4 text-right">$<span>{{ formatTvl(pool.volume24hUsd) }}</span></td>
                  <td class="p-4 text-right">{{ pool.feeBps / 100 }}%</td>
                  <td class="p-4 text-right">{{ formatPoolType(pool.poolType) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class PoolListComponent implements OnInit {
  private store = inject(Store);
  pools = this.store.selectSignal(selectAllPools);
  loading = signal(false);

  ngOnInit() {
    this.store.dispatch(PoolActions.loadPools());
  }

  formatTvl(val: string | number): string {
    const num = Number(val || 0);
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
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
