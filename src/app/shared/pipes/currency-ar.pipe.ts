import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyAr' })
export class CurrencyArPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
