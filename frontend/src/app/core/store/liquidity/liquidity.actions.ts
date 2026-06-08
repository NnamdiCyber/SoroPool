import { createActionGroup, props } from '@ngrx/store';

export const LiquidityActions = createActionGroup({
  source: 'Liquidity',
  events: {
    'Load Positions': props<{ walletAddress: string }>(),
    'Load Positions Success': props<{ positions: any[] }>(),
    'Load Cl Positions Success': props<{ clPositions: any[] }>(),
  },
});
