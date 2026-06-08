import { createReducer, on } from '@ngrx/store';
import { PoolActions } from './pools.actions';

export interface PoolsState {
  pools: any[];
  selectedPool: any | null;
  loading: boolean;
}

const initialState: PoolsState = {
  pools: [],
  selectedPool: null,
  loading: false,
};

export const poolsReducer = createReducer(
  initialState,
  on(PoolActions.loadPools, (state) => ({ ...state, loading: true })),
  on(PoolActions.loadPoolsSuccess, (state, { pools }) => ({ ...state, pools, loading: false })),
  on(PoolActions.selectPool, (state, { pool }) => ({ ...state, selectedPool: pool })),
  on(PoolActions.updatePoolReserves, (state, { poolId, reserve0, reserve1 }) => ({
    ...state,
    pools: state.pools.map((p) => (p.id === poolId ? { ...p, reserve0, reserve1 } : p)),
  })),
);
