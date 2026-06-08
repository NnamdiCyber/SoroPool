import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Connect Wallet': emptyProps(),
    'Disconnect Wallet': emptyProps(),
    'Set Jwt': props<{ jwtToken: string }>(),
    'Refresh Jwt': props<{ refreshToken: string }>(),
  },
});
