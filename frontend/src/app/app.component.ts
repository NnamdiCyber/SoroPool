import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

@Component({
  selector: 'sp-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent],
  template: `
    <sp-layout>
      <router-outlet></router-outlet>
    </sp-layout>
  `,
})
export class AppComponent {}
