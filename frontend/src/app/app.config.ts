import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authReducer } from './core/store/auth/auth.reducer';
import { poolsReducer } from './core/store/pools/pools.reducer';
import { swapReducer } from './core/store/swap/swap.reducer';
import { liquidityReducer } from './core/store/liquidity/liquidity.reducer';
import { farmReducer } from './core/store/farm/farm.reducer';
import { pricesReducer } from './core/store/prices/prices.reducer';
import { analyticsReducer } from './core/store/analytics/analytics.reducer';
import { AuthEffects } from './core/store/auth/auth.effects';
import { PoolsEffects } from './core/store/pools/pools.effects';
import { SwapEffects } from './core/store/swap/swap.effects';
import { apiInterceptor } from './core/interceptors/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideAnimations(),
    provideStore({
      auth: authReducer,
      pools: poolsReducer,
      swap: swapReducer,
      liquidity: liquidityReducer,
      farm: farmReducer,
      prices: pricesReducer,
      analytics: analyticsReducer,
    }),
    provideEffects([AuthEffects, PoolsEffects, SwapEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
    ...(environment.production ? [provideServiceWorker('ngsw-worker.js')] : []),
  ],
};
