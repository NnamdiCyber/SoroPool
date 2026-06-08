import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const SwapActions = createActionGroup({
  source: 'Swap',
  events: {
    'Set Token In': props<{ token: any }>(),
    'Set Token Out': props<{ token: any }>(),
    'Set Amount In': props<{ amount: string }>(),
    'Set Slippage': props<{ slippage: number }>(),
    'Set Deadline': props<{ deadline: number }>(),
    'Get Quote': emptyProps(),
    'Update Quote': props<{ quote: any }>(),
    'Reset Swap': emptyProps(),
  },
});
