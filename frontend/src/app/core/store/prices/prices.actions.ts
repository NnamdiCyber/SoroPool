import { createActionGroup, props } from '@ngrx/store';

export const PriceActions = createActionGroup({
  source: 'Prices',
  events: {
    'Update Prices': props<{ prices: Record<string, any> }>(),
    'Update Price History': props<{ symbol: string; candles: any[] }>(),
  },
});
