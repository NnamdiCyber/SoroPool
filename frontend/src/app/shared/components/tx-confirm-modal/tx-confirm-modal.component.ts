import { Component, input, output } from '@angular/core';

export type TxStep = 'review' | 'signing' | 'submitted' | 'error';

@Component({
  selector: 'sp-tx-confirm-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div class="bg-surface-800 rounded-2xl border border-surface-700 w-full max-w-md mx-4 p-6">
          @switch (step()) {
            @case ('review') {
              <h3 class="text-lg font-semibold mb-4">Confirm Transaction</h3>
              <div class="space-y-3 mb-6">
                @for (detail of details(); track $index) {
                  <div class="flex justify-between text-sm">
                    <span class="text-surface-400">{{ detail.label }}</span>
                    <span class="font-medium">{{ detail.value }}</span>
                  </div>
                }
              </div>
              <div class="flex gap-3">
                <button (click)="cancel.emit()" class="flex-1 py-2.5 rounded-xl bg-surface-700 text-sm font-medium hover:bg-surface-600 transition-colors">
                  Cancel
                </button>
                <button (click)="confirm.emit()" class="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary-400 transition-colors">
                  Confirm
                </button>
              </div>
            }
            @case ('signing') {
              <div class="text-center py-8">
                <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 class="text-lg font-semibold mb-2">Waiting for Signature</h3>
                <p class="text-sm text-surface-400">Please sign the transaction in your wallet</p>
              </div>
            }
            @case ('submitted') {
              <div class="text-center py-8">
                <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">Transaction Submitted</h3>
                @if (txHash()) {
                  <a
                    [href]="explorerUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary hover:underline"
                  >
                    View on Explorer
                  </a>
                }
                <button (click)="dismiss.emit()" class="block mx-auto mt-6 px-6 py-2.5 rounded-xl bg-surface-700 text-sm font-medium hover:bg-surface-600 transition-colors">
                  Close
                </button>
              </div>
            }
            @case ('error') {
              <div class="text-center py-8">
                <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">Transaction Failed</h3>
                <p class="text-sm text-surface-400 mb-6">{{ errorMessage() || 'An error occurred while processing your transaction' }}</p>
                <div class="flex gap-3">
                  <button (click)="dismiss.emit()" class="flex-1 py-2.5 rounded-xl bg-surface-700 text-sm font-medium hover:bg-surface-600 transition-colors">
                    Dismiss
                  </button>
                  <button (click)="retry.emit()" class="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary-400 transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class TxConfirmModalComponent {
  open = input(false);
  step = input<TxStep>('review');
  details = input<{ label: string; value: string }[]>([]);
  txHash = input<string>('');
  errorMessage = input<string>('');
  explorerUrl = input<string>('');

  cancel = output<void>();
  confirm = output<void>();
  dismiss = output<void>();
  retry = output<void>();
}
