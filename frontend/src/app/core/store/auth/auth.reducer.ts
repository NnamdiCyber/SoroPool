import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';

export interface AuthState {
  walletAddress: string | null;
  isConnected: boolean;
  jwtToken: string | null;
}

const initialState: AuthState = {
  walletAddress: null,
  isConnected: false,
  jwtToken: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.connectWallet, (state) => ({ ...state, isConnected: true })),
  on(AuthActions.disconnectWallet, () => initialState),
  on(AuthActions.setJwt, (state, { jwtToken }) => ({ ...state, jwtToken })),
);
