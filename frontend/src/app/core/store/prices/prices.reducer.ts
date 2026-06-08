import { createReducer, on } from '@ngrx/store';
import { PriceActions } from './prices.actions';

export interface PricesState {
  prices: Record<string, any>;
  priceHistory: Record<string, any[]>;
  lastUpdated: Date | null;
}

const initialState: PricesState = {
  prices: {},
  priceHistory: {},
  lastUpdated: null,
};

export const pricesReducer = createReducer(
  initialState,
  on(PriceActions.updatePrices, (state, { prices }) => ({ ...state, prices, lastUpdated: new Date() })),
  on(PriceActions.updatePriceHistory, (state, { symbol, candles }) => ({
    ...state,
    priceHistory: { ...state.priceHistory, [symbol]: candles },
  })),
);
