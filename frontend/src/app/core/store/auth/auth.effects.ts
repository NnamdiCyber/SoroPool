import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { AuthActions } from './auth.actions';
import { WalletService } from '../../services/wallet.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private walletService = inject(WalletService);

  connectWallet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.connectWallet),
      switchMap(() =>
        from(this.walletService.connect()).pipe(
          switchMap((address) => {
            if (!address) return of(AuthActions.disconnectWallet());

            return from(
              fetch(`${environment.apiUrl}/auth/challenge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address }),
              }).then((r) => r.json() as Promise<{ nonce: string }>),
            ).pipe(
              switchMap(({ nonce }) =>
                from(this.walletService.signTransaction(nonce)).pipe(
                  switchMap((signedXdr) =>
                    from(
                      fetch(`${environment.apiUrl}/auth/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ walletAddress: address, signature: signedXdr }),
                      }).then((r) => r.json() as Promise<{ accessToken: string; refreshToken: string }>),
                    ).pipe(
                      map((tokens) => AuthActions.setJwt({ jwtToken: tokens.accessToken })),
                      catchError(() => of(AuthActions.setJwt({ jwtToken: '' }))),
                    ),
                  ),
                  catchError(() => of(AuthActions.setJwt({ jwtToken: '' }))),
                ),
              ),
              catchError(() => of(AuthActions.setJwt({ jwtToken: '' }))),
            );
          }),
        ),
      ),
    ),
  );

  disconnectWallet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.disconnectWallet),
      tap(() => this.walletService.disconnect()),
    ),
    { dispatch: false },
  );
}
