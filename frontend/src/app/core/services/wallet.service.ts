import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WalletService {
  readonly isConnected = signal(false);
  readonly walletAddress = signal<string | null>(null);

  async connect(): Promise<string | null> {
    try {
      const { isConnected } = await import('@stellar/freighter-api');
      const connected = await isConnected();
      if (connected) {
        const { getPublicKey } = await import('@stellar/freighter-api');
        const key = await getPublicKey();
        this.walletAddress.set(key);
        this.isConnected.set(true);
        return key;
      }
    } catch {
      console.warn('Freighter not detected');
    }
    return null;
  }

  disconnect() {
    this.walletAddress.set(null);
    this.isConnected.set(false);
  }

  async signTransaction(xdr: string): Promise<string> {
    const { signTransaction } = await import('@stellar/freighter-api');
    return signTransaction(xdr);
  }
}
