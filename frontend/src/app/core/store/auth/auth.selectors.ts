import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectWalletAddress = createSelector(selectAuthState, (s) => s.walletAddress);
export const selectIsConnected = createSelector(selectAuthState, (s) => s.isConnected);
export const selectJwtToken = createSelector(selectAuthState, (s) => s.jwtToken);
