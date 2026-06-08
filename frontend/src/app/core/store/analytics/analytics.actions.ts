import { createActionGroup, props } from '@ngrx/store';

export const AnalyticsActions = createActionGroup({
  source: 'Analytics',
  events: {
    'Update Tvl': props<{ tvl: number }>(),
    'Update Volume': props<{ volume24h: number }>(),
    'Update Fees': props<{ fees24h: number }>(),
  },
});
