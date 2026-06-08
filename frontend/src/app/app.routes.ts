import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/swap', pathMatch: 'full' },
  {
    path: 'swap',
    loadComponent: () => import('./features/swap/swap.component').then((m) => m.SwapComponent),
  },
  {
    path: 'liquidity',
    loadChildren: () => import('./features/liquidity/liquidity.routes'),
  },
  {
    path: 'pool-explorer',
    loadChildren: () => import('./features/pool-explorer/pool-explorer.routes'),
  },
  {
    path: 'farm',
    loadChildren: () => import('./features/farm/farm.routes'),
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./features/portfolio/portfolio.component').then((m) => m.PortfolioComponent),
  },
  {
    path: 'governance',
    loadChildren: () => import('./features/governance/governance.routes'),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
  },
  {
    path: 'create-pool',
    loadComponent: () => import('./features/create-pool/create-pool.component').then((m) => m.CreatePoolComponent),
  },
  { path: '**', redirectTo: '/swap' },
];
