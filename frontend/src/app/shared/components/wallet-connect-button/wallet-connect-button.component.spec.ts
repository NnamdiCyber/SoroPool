import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { WalletConnectButtonComponent } from './wallet-connect-button.component';
import { AuthActions } from '../../../core/store/auth/auth.actions';
import { selectIsConnected, selectWalletAddress } from '../../../core/store/auth/auth.selectors';

describe('WalletConnectButtonComponent', () => {
  let component: WalletConnectButtonComponent;
  let fixture: ComponentFixture<WalletConnectButtonComponent>;
  let store: MockStore;

  const setupWithState = async (isConnected: boolean, walletAddress: string | null = null) => {
    await TestBed.configureTestingModule({
      imports: [WalletConnectButtonComponent],
      providers: [
        provideMockStore({
          initialState: { auth: { isConnected, walletAddress, jwtToken: null } },
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(selectIsConnected, isConnected);
    store.overrideSelector(selectWalletAddress, walletAddress);

    fixture = TestBed.createComponent(WalletConnectButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  it('shows Connect Wallet button when disconnected', async () => {
    await setupWithState(false);
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('Connect Wallet');
  });

  it('dispatches connectWallet action on connect click', async () => {
    await setupWithState(false);
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.connectWallet());
  });

  it('shows truncated address when connected', async () => {
    await setupWithState(true, 'GABCDE1234567890FGHIJ');
    store.refreshState();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('GABC');
    expect(text).toContain('GHIJ');
  });

  it('dispatches disconnectWallet on disconnect click', async () => {
    await setupWithState(true, 'GABCDE1234567890FGHIJ');
    store.refreshState();
    fixture.detectChanges();
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.disconnect();
    expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.disconnectWallet());
  });
});
