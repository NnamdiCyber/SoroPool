import { Component, input, output } from '@angular/core';

@Component({
  selector: 'sp-harvest-modal',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-surface-800 rounded-2xl p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold mb-4">Harvest Rewards</h3>
          <p class="text-2xl font-bold text-primary mb-6">{{ rewards() }} SPL</p>
          <div class="flex gap-3">
            <button (click)="visibleChange.emit(false)" class="flex-1 py-2 rounded-lg bg-surface-700 text-sm font-medium">Cancel</button>
            <button (click)="confirm.emit()" class="flex-1 py-2 rounded-lg bg-primary text-black text-sm font-medium">Harvest</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class HarvestModalComponent {
  visible = input(false);
  rewards = input('0');
  visibleChange = output<boolean>();
  confirm = output<void>();
}
