import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const PoolActions = createActionGroup({
  source: 'Pools',
  events: {
    'Load Pools': emptyProps(),
    'Load Pools Success': props<{ pools: any[] }>(),
    'Select Pool': props<{ pool: any }>(),
    'Update Pool Reserves': props<{ poolId: string; reserve0: string; reserve1: string }>(),
  },
});
