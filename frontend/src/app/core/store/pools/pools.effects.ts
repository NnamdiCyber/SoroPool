import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { PoolActions } from './pools.actions';
import { environment } from '../../../../environments/environment';

@Injectable()
export class PoolsEffects {
  private actions$ = inject(Actions);

  loadPools$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PoolActions.loadPools),
      switchMap(() =>
        from(
          fetch(`${environment.apiUrl}/pools`).then((r) => r.json()),
        ).pipe(
          map((res: { data: unknown[] }) => PoolActions.loadPoolsSuccess({ pools: res.data || res })),
          catchError(() => of(PoolActions.loadPoolsSuccess({ pools: [] }))),
        ),
      ),
    ),
  );
}
