import { createReducer, on } from '@ngrx/store';
import { AnalyticsActions } from './analytics.actions';

export interface AnalyticsState {
  protocolTvl: number;
  volume24h: number;
  fees24h: number;
}

const initialState: AnalyticsState = {
  protocolTvl: 0,
  volume24h: 0,
  fees24h: 0,
};

export const analyticsReducer = createReducer(
  initialState,
  on(AnalyticsActions.updateTvl, (state, { tvl }) => ({ ...state, protocolTvl: tvl })),
  on(AnalyticsActions.updateVolume, (state, { volume24h }) => ({ ...state, volume24h })),
  on(AnalyticsActions.updateFees, (state, { fees24h }) => ({ ...state, fees24h })),
);
