import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
}

export interface PoolReserves {
  reserve0: string;
  reserve1: string;
}

@Injectable({ providedIn: 'root' })
export class StellarService {
  private horizonUrl = environment.stellar.horizonUrl;
  private sorobanRpcUrl = environment.stellar.sorobanRpcUrl;

  async getAccountBalances(address: string): Promise<{ asset_type: string; balance: string; asset_code?: string; asset_issuer?: string }[]> {
    const res = await fetch(`${this.horizonUrl}/accounts/${address}`);
    const data = await res.json() as { balances?: { asset_type: string; balance: string; asset_code?: string; asset_issuer?: string }[] };
    return data.balances || [];
  }

  async submitTransaction(signedXdr: string): Promise<{ hash: string; status: string }> {
    const res = await fetch(`${this.sorobanRpcUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: signedXdr }),
    });
    return res.json() as Promise<{ hash: string; status: string }>;
  }

  async getTokenDetails(contractId: string): Promise<TokenDetails> {
    const res = await fetch(`${this.sorobanRpcUrl}/contracts/${contractId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'contractReader',
        params: { contractId, key: JSON.stringify(['Meta']) },
      }),
    });
    const data = await res.json() as { result?: { value?: string } };
    try {
      const parsed = JSON.parse(data?.result?.value || '{}') as TokenDetails;
      return parsed;
    } catch {
      return { name: 'Unknown', symbol: '???', decimals: 7 };
    }
  }

  async getPoolReserves(poolAddress: string): Promise<PoolReserves | null> {
    try {
      const res = await fetch(`${this.sorobanRpcUrl}/rpc/v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'contractReader',
          params: { contractId: poolAddress, key: JSON.stringify(['Reserves']) },
        }),
      });
      const data = await res.json() as { result?: { value?: string } };
      if (data?.result?.value) {
        const parsed = JSON.parse(data.result.value) as [string, string];
        return { reserve0: parsed[0], reserve1: parsed[1] };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getPoolReservesFromApi(poolId: string): Promise<PoolReserves | null> {
    try {
      const res = await fetch(`${environment.apiUrl}/pools/${poolId}/reserves`);
      const data = await res.json() as PoolReserves;
      return data;
    } catch {
      return null;
    }
  }
}
