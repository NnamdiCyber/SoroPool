import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pool-list/pool-list.component').then((m) => m.PoolListComponent) },
  { path: 'add/:poolId', loadComponent: () => import('./add-liquidity/add-liquidity.component').then((m) => m.AddLiquidityComponent) },
  { path: 'remove/:poolId', loadComponent: () => import('./remove-liquidity/remove-liquidity.component').then((m) => m.RemoveLiquidityComponent) },
  { path: 'concentrated/:poolId', loadComponent: () => import('./concentrated-lp/concentrated-lp.component').then((m) => m.ConcentratedLpComponent) },
] as Routes;
