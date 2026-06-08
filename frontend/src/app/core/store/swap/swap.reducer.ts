import { createReducer, on } from '@ngrx/store';
import { SwapActions } from './swap.actions';

export interface SwapState {
  tokenIn: any | null;
  tokenOut: any | null;
  amountIn: string;
  quote: any | null;
  route: any | null;
  slippageTolerance: number;
  deadline: number;
  priceImpactWarning: boolean;
}

const initialState: SwapState = {
  tokenIn: null,
  tokenOut: null,
  amountIn: '',
  quote: null,
  route: null,
  slippageTolerance: 0.005,
  deadline: 30,
  priceImpactWarning: false,
};

export const swapReducer = createReducer(
  initialState,
  on(SwapActions.setTokenIn, (state, { token }) => ({ ...state, tokenIn: token })),
  on(SwapActions.setTokenOut, (state, { token }) => ({ ...state, tokenOut: token })),
  on(SwapActions.setAmountIn, (state, { amount }) => ({ ...state, amountIn: amount })),
  on(SwapActions.setSlippage, (state, { slippage }) => ({ ...state, slippageTolerance: slippage })),
  on(SwapActions.setDeadline, (state, { deadline }) => ({ ...state, deadline })),
  on(SwapActions.updateQuote, (state, { quote }) => ({ ...state, quote, route: quote?.route || null })),
  on(SwapActions.resetSwap, () => initialState),
);
