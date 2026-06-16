import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface TokenOption {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  logoUrl?: string;
  balance?: string;
  usdValue?: string;
}

@Component({
  selector: 'sp-token-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" (click)="close.emit()">
        <div class="bg-surface-800 rounded-2xl border border-surface-700 w-full max-w-md mx-4 max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-4 border-b border-surface-700">
            <h3 class="text-lg font-semibold">Select Token</h3>
            <button (click)="close.emit()" class="p-1 rounded-lg hover:bg-surface-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-4">
            <input
              [(ngModel)]="query"
              type="text"
              placeholder="Search by name, symbol, or address"
              class="w-full px-3 py-2 rounded-lg bg-surface-700 text-sm outline-none border border-surface-600 focus:border-primary transition-colors"
            />
          </div>

          <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
            @for (token of filteredTokens(); track token.contractAddress) {
              <button
                (click)="select.emit(token); close.emit()"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-700 transition-colors text-left"
              >
                <div class="w-9 h-9 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {{ token.symbol.slice(0, 2) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ token.symbol }}</p>
                  <p class="text-xs text-surface-400 truncate">{{ token.name }}</p>
                </div>
                @if (token.balance) {
                  <div class="text-right shrink-0">
                    <p class="text-sm font-medium">{{ token.balance }}</p>
                    @if (token.usdValue) {
                      <p class="text-xs text-surface-400"><span>~$</span>{{ token.usdValue }}</p>
                    }
                  </div>
                }
              </button>
            } @empty {
              <div class="text-center py-8 text-surface-400 text-sm">
                {{ query() ? 'No tokens found' : 'No tokens available' }}
              </div>
            }
          </div>

          <div class="p-4 border-t border-surface-700">
            <button class="w-full py-2 rounded-lg border border-dashed border-surface-600 text-sm text-surface-400 hover:text-white hover:border-surface-500 transition-colors">
              + Manage Tokens
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TokenSelectorComponent {
  open = input(false);
  tokens = input<TokenOption[]>([]);
  close = output<void>();
  select = output<TokenOption>();

  query = signal('');

  filteredTokens = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.tokens();
    return this.tokens().filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.contractAddress.toLowerCase().includes(q),
    );
  });
}
