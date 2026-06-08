import { createReducer, on } from '@ngrx/store';
import { LiquidityActions } from './liquidity.actions';

export interface LiquidityState {
  positions: any[];
  clPositions: any[];
}

const initialState: LiquidityState = {
  positions: [],
  clPositions: [],
};

export const liquidityReducer = createReducer(
  initialState,
  on(LiquidityActions.loadPositionsSuccess, (state, { positions }) => ({ ...state, positions })),
  on(LiquidityActions.loadClPositionsSuccess, (state, { clPositions }) => ({ ...state, clPositions })),
);
