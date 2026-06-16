import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TokenAmountInputComponent } from '../../../shared/components/token-amount-input/token-amount-input.component';
import { selectAllPools } from '../../../core/store/pools/pools.selectors';
import { PoolActions } from '../../../core/store/pools/pools.actions';

@Component({
  selector: 'sp-concentrated-lp',
  standalone: true,
  imports: [FormsModule, TokenAmountInputComponent, RouterLink],
  template: `
    <div class="max-w-lg mx-auto mt-8 px-4">
      <div class="mb-4">
        <a routerLink="/liquidity" class="text-sm text-primary hover:underline">&larr; Back to Pools</a>
      </div>

      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h2 class="text-xl font-bold mb-6">Concentrated Liquidity</h2>

        <div class="mb-4 p-3 bg-surface-900 rounded-xl text-sm">
          <div class="flex items-center justify-between">
            <span class="text-surface-400">Pool</span>
            <span class="font-medium">{{ poolName() }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-xs text-surface-400">Min Price</label>
            <input type="number" [ngModel]="tickLower()" (ngModelChange)="tickLower.set($event)"
              class="w-full mt-1 px-3 py-2 rounded-lg bg-surface-700 text-sm outline-none" />
            <p class="text-xs text-surface-500 mt-1">
              Current: {{ formatPrice(currentPrice()) }}
            </p>
          </div>
          <div>
            <label class="text-xs text-surface-400">Max Price</label>
            <input type="number" [ngModel]="tickUpper()" (ngModelChange)="tickUpper.set($event)"
              class="w-full mt-1 px-3 py-2 rounded-lg bg-surface-700 text-sm outline-none" />
          </div>

          <div class="flex gap-2">
            @for (preset of rangePresets; track preset.label) {
              <button (click)="setRangePreset(preset.pct)" [class]="activePreset() === preset.pct ? 'bg-primary text-black' : 'bg-surface-700'"
                class="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {{ preset.label }}
              </button>
            }
          </div>

          <button (click)="setFullRange()" class="w-full py-2 rounded-lg bg-surface-700 text-sm font-medium hover:bg-surface-600 transition-colors">
            Full Range (100% capital efficiency)
          </button>

          <div class="p-3 bg-surface-900 rounded-xl text-sm space-y-2">
            <div class="flex justify-between">
              <span class="text-surface-400">Current Price</span>
              <span class="font-medium">{{ formatPrice(currentPrice()) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">Selected Range</span>
              <span class="font-medium">{{ formatPrice(selectedMinPrice()) }} &ndash; {{ formatPrice(selectedMaxPrice()) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-400">Capital Efficiency</span>
              <span class="text-primary font-semibold">{{ capitalEfficiency() }}x</span>
            </div>
          </div>
        </div>

        <div class="space-y-2 mt-6">
          <sp-token-amount-input label="Token Amount" />
        </div>

        <button
          class="w-full mt-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-400 transition-colors"
        >
          Mint Position
        </button>
      </div>
    </div>
  `,
})
export class ConcentratedLpComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);

  poolId = signal('');
  tickLower = signal(-887272);
  tickUpper = signal(887272);

  allPools = this.store.selectSignal(selectAllPools);

  readonly rangePresets = [
    { label: '\u00B110%', pct: 10 },
    { label: '\u00B125%', pct: 25 },
    { label: '\u00B150%', pct: 50 },
  ];

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

  currentPrice(): number {
    const p = this.pool();
    if (!p || !p.reserve0 || !p.reserve1) return 1;
    return Number(p.reserve1) / Number(p.reserve0);
  }

  selectedMinPrice = computed(() => Math.pow(1.0001, this.tickLower()));
  selectedMaxPrice = computed(() => Math.pow(1.0001, this.tickUpper()));

  activePreset = computed(() => {
    const current = this.currentPrice();
    const low = this.selectedMinPrice();
    const high = this.selectedMaxPrice();
    for (const p of this.rangePresets) {
      const expectedLow = current * (1 - p.pct / 100);
      const expectedHigh = current * (1 + p.pct / 100);
      if (Math.abs(low - expectedLow) < 0.001 && Math.abs(high - expectedHigh) < 0.001) return p.pct;
    }
    return null;
  });

  setRangePreset(pct: number) {
    const current = this.currentPrice();
    const low = current * (1 - pct / 100);
    const high = current * (1 + pct / 100);
    this.tickLower.set(Math.round(Math.log(low) / Math.log(1.0001)));
    this.tickUpper.set(Math.round(Math.log(high) / Math.log(1.0001)));
  }

  setFullRange() {
    this.tickLower.set(-887272);
    this.tickUpper.set(887272);
  }

  capitalEfficiency = computed(() => {
    const low = this.selectedMinPrice();
    const high = this.selectedMaxPrice();
    if (high <= low || low <= 0) return '∞';
    const sqrtRatio = Math.sqrt(high / low);
    const efficiency = sqrtRatio / (sqrtRatio - 1);
    return efficiency.toFixed(1);
  });

  formatPrice(price: number): string {
    if (price < 0.0001) return price.toExponential(2);
    if (price < 1) return price.toPrecision(4);
    if (price > 1000000) return (price / 1000000).toFixed(2) + 'M';
    return price.toFixed(4);
  }
}
