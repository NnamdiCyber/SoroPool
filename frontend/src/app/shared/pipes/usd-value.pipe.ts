import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'usdValue', standalone: true })
export class UsdValuePipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value == null) return '$0.00';

    const num = Number(value);
    if (num === 0) return '$0.00';
    if (num < 0.01) return '<$0.01';
    if (num < 1) return '$' + num.toPrecision(3);

    const abs = Math.abs(num);
    if (abs >= 1_000_000_000) return '$' + (num / 1_000_000_000).toFixed(2) + 'B';
    if (abs >= 1_000_000) return '$' + (num / 1_000_000).toFixed(2) + 'M';
    if (abs >= 1_000) return '$' + (num / 1_000).toFixed(2) + 'K';

    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
