import { Component } from '@angular/core';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'sp-wallet-connect-button',
  standalone: true,
  template: `
    @if (walletService.isConnected()) {
      <button class="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-sm font-medium transition-colors">
        {{ walletService.walletAddress()?.slice(0, 4) }}...{{ walletService.walletAddress()?.slice(-4) }}
      </button>
    } @else {
      <button (click)="connect()" class="px-4 py-2 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary-400 transition-colors">
        Connect Wallet
      </button>
    }
  `,
})
export class WalletConnectButtonComponent {
  constructor(public walletService: WalletService) {}

  async connect() {
    await this.walletService.connect();
  }
}
