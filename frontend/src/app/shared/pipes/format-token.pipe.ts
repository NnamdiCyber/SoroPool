import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatToken', standalone: true })
export class FormatTokenPipe implements PipeTransform {
  transform(value: string | number | bigint | null | undefined, decimals: number = 7): string {
    if (value == null) return '0';

    let num: number;
    if (typeof value === 'bigint') {
      const divisor = 10 ** decimals;
      const whole = Number(value / BigInt(divisor));
      const remainder = Number(value % BigInt(divisor)) / divisor;
      num = whole + remainder;
    } else {
      num = Number(value);
    }

    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toPrecision(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1_000_000) return (num / 1000).toFixed(2) + 'K';
    return (num / 1_000_000).toFixed(2) + 'M';
  }
}
