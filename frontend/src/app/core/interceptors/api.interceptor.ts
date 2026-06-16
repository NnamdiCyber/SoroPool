import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectJwtToken } from '../store/auth/auth.selectors';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  let token: string | null = null;
  store
    .select(selectJwtToken)
    .pipe(take(1))
    .subscribe((t) => (token = t));

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
