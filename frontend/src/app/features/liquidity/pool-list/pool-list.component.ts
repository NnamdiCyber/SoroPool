import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sp-pool-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto mt-8 px-4">
      <h2 class="text-xl font-bold mb-6">Pools</h2>
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
            <tr *ngFor="let pool of pools" class="border-t border-surface-700 hover:bg-surface-700/50 cursor-pointer" [routerLink]="['/liquidity/add', pool.id]">
              <td class="p-4 font-medium">{{ pool.token0?.symbol }}/{{ pool.token1?.symbol }}</td>
              <td class="p-4 text-right">{{ pool.tvlUsd }}</td>
              <td class="p-4 text-right">{{ pool.volume24hUsd }}</td>
              <td class="p-4 text-right">{{ pool.feeBps / 100 }}%</td>
              <td class="p-4 text-right">{{ pool.poolType }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class PoolListComponent {
  pools: any[] = [];
}
