import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pool-overview/pool-overview.component').then((m) => m.PoolOverviewComponent),
  },
  {
    path: ':poolId',
    loadComponent: () => import('./pool-overview/pool-overview.component').then((m) => m.PoolOverviewComponent),
  },
] as Routes;
