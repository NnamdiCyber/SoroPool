import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PoolsState } from './pools.reducer';

export const selectPoolsState = createFeatureSelector<PoolsState>('pools');
export const selectAllPools = createSelector(selectPoolsState, (s) => s.pools);
export const selectSelectedPool = createSelector(selectPoolsState, (s) => s.selectedPool);
