import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SwapActions } from './swap.actions';
import { environment } from '../../../../environments/environment';

@Injectable()
export class SwapEffects {
  private actions$ = inject(Actions);

  getQuote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SwapActions.getQuote),
      switchMap(({ tokenIn, tokenOut, amountIn }) => {
        if (!amountIn || !tokenIn || !tokenOut) {
          return of(SwapActions.updateQuote({ quote: null }));
        }

        const params = new URLSearchParams({ tokenIn, tokenOut, amountIn });

        return from(
          fetch(`${environment.apiUrl}/swap/quote?${params}`).then((r) => r.json()),
        ).pipe(
          map((quote) => SwapActions.updateQuote({ quote })),
          catchError(() => of(SwapActions.updateQuote({ quote: null }))),
        );
      }),
    ),
  );
}
