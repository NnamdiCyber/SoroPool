import { createReducer, on } from '@ngrx/store';
import { FarmActions } from './farm.actions';

export interface FarmState {
  farms: any[];
  userPositions: any[];
}

const initialState: FarmState = {
  farms: [],
  userPositions: [],
};

export const farmReducer = createReducer(
  initialState,
  on(FarmActions.loadFarmsSuccess, (state, { farms }) => ({ ...state, farms })),
  on(FarmActions.loadPositionsSuccess, (state, { positions }) => ({ ...state, userPositions: positions })),
);
