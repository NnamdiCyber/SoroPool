import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentage', standalone: true })
export class PercentagePipe implements PipeTransform {
  transform(value: number | null | undefined, decimals: number = 2): string {
    if (value == null) return '0%';
    const sign = value > 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(decimals)}%`;
  }
}
