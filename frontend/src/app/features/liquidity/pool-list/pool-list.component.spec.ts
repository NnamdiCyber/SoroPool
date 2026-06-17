import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { PoolListComponent } from './pool-list.component';
import { selectAllPools } from '../../../core/store/pools/pools.selectors';
import { RouterTestingModule } from '@angular/router/testing';

const mockPools = [
  {
    id: 'pool-1',
    poolType: 'constant_product',
    feeBps: 30,
    tvlUsd: '150000',
    volume24hUsd: '50000',
    token0: { symbol: 'XLM' },
    token1: { symbol: 'USDC' },
  },
  {
    id: 'pool-2',
    poolType: 'stableswap',
    feeBps: 5,
    tvlUsd: '2000000',
    volume24hUsd: '1200000',
    token0: { symbol: 'USDC' },
    token1: { symbol: 'USDT' },
  },
];

describe('PoolListComponent', () => {
  let component: PoolListComponent;
  let fixture: ComponentFixture<PoolListComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoolListComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          initialState: { pools: { pools: mockPools, selectedPool: null, poolStats: {}, loading: 'idle' } },
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllPools, mockPools as any);

    fixture = TestBed.createComponent(PoolListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders all pools from the store', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('displays pool pair names', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('XLM/USDC');
    expect(text).toContain('USDC/USDT');
  });

  it('displays fee tier correctly', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('0.3%');
    expect(text).toContain('0.05%');
  });

  it('displays pool type badges', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('CP');
    expect(text).toContain('Stable');
  });

  it('shows empty state when no pools', () => {
    store.overrideSelector(selectAllPools, []);
    store.refreshState();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pools available yet');
  });

  it('formatTvl formats millions correctly', () => {
    expect(component.formatTvl('2000000')).toBe('2.00M');
    expect(component.formatTvl('150000')).toBe('150.00K');
    expect(component.formatTvl('500')).toBe('500.00');
  });
});
