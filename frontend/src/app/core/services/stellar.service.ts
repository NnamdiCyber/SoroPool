import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StellarService {
  private horizonUrl = environment.stellar.horizonUrl;
  private sorobanRpcUrl = environment.stellar.sorobanRpcUrl;

  async getAccountBalances(address: string): Promise<any[]> {
    const res = await fetch(`${this.horizonUrl}/accounts/${address}`);
    const data = await res.json();
    return data.balances || [];
  }

  async submitTransaction(signedXdr: string): Promise<any> {
    const res = await fetch(`${this.sorobanRpcUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: signedXdr }),
    });
    return res.json();
  }
}
