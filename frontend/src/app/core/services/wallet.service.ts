import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WalletService {
  readonly isConnected = signal(false);
  readonly walletAddress = signal<string | null>(null);
  readonly walletType = signal<'freighter' | 'albedo' | 'xbull' | null>(null);

  async connect(): Promise<string | null> {
    const freighterKey = await this.tryFreighter();
    if (freighterKey) return freighterKey;

    const albedoKey = await this.tryAlbedo();
    if (albedoKey) return albedoKey;

    const xBullKey = await this.tryXBull();
    if (xBullKey) return xBullKey;

    return null;
  }

  private async tryFreighter(): Promise<string | null> {
    try {
      const { isConnected, getPublicKey } = await import('@stellar/freighter-api');
      const connected = await isConnected();
      if (connected) {
        const key = await getPublicKey();
        this.walletAddress.set(key);
        this.isConnected.set(true);
        this.walletType.set('freighter');
        return key;
      }
    } catch {
      console.warn('Freighter not detected');
    }
    return null;
  }

  private async tryAlbedo(): Promise<string | null> {
    try {
      const w = window as unknown as Record<string, unknown>;
      const albedo = w['albedo'] as
        | { publicKey: (params?: Record<string, unknown>) => Promise<Record<string, string | undefined>> }
        | undefined;
      if (albedo?.publicKey) {
        const res = await albedo.publicKey();
        const key = res['publicKey'] || null;
        if (key) {
          this.walletAddress.set(key);
          this.isConnected.set(true);
          this.walletType.set('albedo');
          return key;
        }
      }
    } catch {
      console.warn('Albedo not detected');
    }
    return null;
  }

  private async tryXBull(): Promise<string | null> {
    try {
      const w = window as unknown as Record<string, unknown>;
      const xbull = w['xbull'] as
        | { connect(): Promise<{ publicKey: string }> }
        | undefined;
      if (xbull?.connect) {
        const res = await xbull.connect();
        if (res?.publicKey) {
          this.walletAddress.set(res.publicKey);
          this.isConnected.set(true);
          this.walletType.set('xbull');
          return res.publicKey;
        }
      }
    } catch {
      console.warn('xBull not detected');
    }
    return null;
  }

  disconnect() {
    this.walletAddress.set(null);
    this.isConnected.set(false);
    this.walletType.set(null);
  }

  async signTransaction(xdr: string): Promise<string> {
    const type = this.walletType();
    if (type === 'freighter') {
      const { signTransaction } = await import('@stellar/freighter-api');
      return signTransaction(xdr);
    }
    if (type === 'albedo') {
      const w = window as unknown as Record<string, unknown>;
      const albedo = w['albedo'] as
        | { tx: (xdr: string) => Promise<Record<string, string>> }
        | undefined;
      if (albedo?.tx) {
        const res = await albedo.tx(xdr);
        return res['signedEnvelopeXdr'] || res['result'] || '';
      }
    }
    if (type === 'xbull') {
      const w = window as unknown as Record<string, unknown>;
      const xbull = w['xbull'] as
        | { sign: (xdr: string) => Promise<{ result: string }> }
        | undefined;
      if (xbull?.sign) {
        const res = await xbull.sign(xdr);
        return res.result;
      }
    }
    throw new Error('No wallet connected');
  }
}
