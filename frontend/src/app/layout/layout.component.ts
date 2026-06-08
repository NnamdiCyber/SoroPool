import { Component } from '@angular/core';
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
          </div>
        </div>
        <sp-wallet-connect-button></sp-wallet-connect-button>
      </div>
    </nav>
    <main class="pt-16 min-h-screen">
      <ng-content></ng-content>
    </main>
  `,
  styles: [`
    .nav-link { @apply text-surface-300 hover:text-white transition-colors text-sm font-medium; }
  `],
})
export class LayoutComponent {}
