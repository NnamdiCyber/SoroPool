import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WalletConnectButtonComponent } from '../shared/components/wallet-connect-button/wallet-connect-button.component';

@Component({
  selector: 'sp-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, WalletConnectButtonComponent],
  template: `
    <nav class="fixed top-0 z-50 w-full bg-surface-800/80 backdrop-blur-md border-b border-surface-700">
      <div class="flex items-center justify-between px-6 h-16">
        <div class="flex items-center gap-8">
          <a routerLink="/" class="text-xl font-bold text-primary">SoroPool</a>
          <div class="hidden md:flex gap-6">
            <a routerLink="/swap" routerLinkActive="text-primary" class="nav-link">Swap</a>
            <a routerLink="/liquidity" routerLinkActive="text-primary" class="nav-link">Liquidity</a>
            <a routerLink="/pool-explorer" routerLinkActive="text-primary" class="nav-link">Pools</a>
            <a routerLink="/farm" routerLinkActive="text-primary" class="nav-link">Farm</a>
            <a routerLink="/portfolio" routerLinkActive="text-primary" class="nav-link">Portfolio</a>
            <a routerLink="/analytics" routerLinkActive="text-primary" class="nav-link">Analytics</a>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <sp-wallet-connect-button></sp-wallet-connect-button>
          <button (click)="mobileOpen.set(!mobileOpen())" class="md:hidden p-2 rounded-lg hover:bg-surface-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (mobileOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      @if (mobileOpen()) {
        <div class="md:hidden border-t border-surface-700 bg-surface-800 px-4 py-3 flex flex-col gap-3">
          <a routerLink="/swap" routerLinkActive="text-primary" class="nav-link" (click)="mobileOpen.set(false)">Swap</a>
          <a routerLink="/liquidity" routerLinkActive="text-primary" class="nav-link" (click)="mobileOpen.set(false)">Liquidity</a>
          <a routerLink="/pool-explorer" routerLinkActive="text-primary" class="nav-link" (click)="mobileOpen.set(false)">Pools</a>
          <a routerLink="/farm" routerLinkActive="text-primary" class="nav-link" (click)="mobileOpen.set(false)">Farm</a>
          <a routerLink="/portfolio" routerLinkActive="text-primary" class="nav-link" (click)="mobileOpen.set(false)">Portfolio</a>
          <a routerLink="/analytics" routerLinkActive="text-primary" class="nav-link" (click)="mobileOpen.set(false)">Analytics</a>
        </div>
      }
    </nav>
    <main class="pt-16 min-h-screen">
      <ng-content></ng-content>
    </main>
  `,
  styles: [`
    .nav-link { @apply text-surface-300 hover:text-white transition-colors text-sm font-medium; }
  `],
})
export class LayoutComponent {
  mobileOpen = signal(false);
}
