import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../core/store/auth/auth.actions';
import { selectWalletAddress, selectIsConnected } from '../../../core/store/auth/auth.selectors';

@Component({
  selector: 'sp-wallet-connect-button',
  standalone: true,
  template: `
    @if (isConnected()) {
      <div class="relative" (mouseenter)="showDropdown = true" (mouseleave)="showDropdown = false">
        <button class="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-sm font-medium transition-colors flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-400"></span>
          {{ walletAddress()?.slice(0, 4) }}...{{ walletAddress()?.slice(-4) }}
        </button>
        @if (showDropdown) {
          <div class="absolute right-0 mt-2 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50">
            <a
              [href]="'https://stellar.expert/explorer/testnet/account/' + walletAddress()"
              target="_blank"
              rel="noopener noreferrer"
              class="block px-4 py-3 text-sm text-surface-300 hover:text-white hover:bg-surface-700 transition-colors"
            >
              View on Explorer
            </a>
            <button
              (click)="disconnect()"
              class="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-surface-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        }
      </div>
    } @else {
      <button (click)="connect()" class="px-4 py-2 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary-400 transition-colors">
        Connect Wallet
      </button>
    }
  `,
})
export class WalletConnectButtonComponent {
  private store = inject(Store);

  walletAddress = this.store.selectSignal(selectWalletAddress);
  isConnected = this.store.selectSignal(selectIsConnected);
  showDropdown = false;

  connect() {
    this.store.dispatch(AuthActions.connectWallet());
  }

  disconnect() {
    this.store.dispatch(AuthActions.disconnectWallet());
    this.showDropdown = false;
  }
}
