import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./governance.component').then((m) => m.GovernanceComponent),
  },
] as Routes;
