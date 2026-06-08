import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SwapState } from './swap.reducer';

export const selectSwapState = createFeatureSelector<SwapState>('swap');
export const selectSwapQuote = createSelector(selectSwapState, (s) => s.quote);
export const selectSwapRoute = createSelector(selectSwapState, (s) => s.route);
export const selectMinAmountOut = createSelector(selectSwapState, (s) => {
  if (!s.quote?.amountOut) return 0n;
  const out = BigInt(s.quote.amountOut);
  return out * BigInt(Math.floor((1 - s.slippageTolerance) * 10000)) / 10000n;
});
export const selectPriceImpactSeverity = createSelector(selectSwapState, (s) => {
  const impact = s.quote?.priceImpact ?? 0;
  if (impact > 0.15) return 'critical';
  if (impact > 0.05) return 'high';
  if (impact > 0.01) return 'medium';
  return 'low';
});
export const selectSlippageTolerance = createSelector(selectSwapState, (s) => s.slippageTolerance);
