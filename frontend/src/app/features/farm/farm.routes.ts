import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./farm-list/farm-list.component').then((m) => m.FarmListComponent) },
  { path: ':farmId', loadComponent: () => import('./farm-detail/farm-detail.component').then((m) => m.FarmDetailComponent) },
] as Routes;
