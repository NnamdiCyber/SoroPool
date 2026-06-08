import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const FarmActions = createActionGroup({
  source: 'Farm',
  events: {
    'Load Farms': emptyProps(),
    'Load Farms Success': props<{ farms: any[] }>(),
    'Load Positions': props<{ walletAddress: string }>(),
    'Load Positions Success': props<{ positions: any[] }>(),
  },
});
