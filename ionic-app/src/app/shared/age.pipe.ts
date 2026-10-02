import { Pipe, PipeTransform } from '@angular/core';

/** Convierte meses en texto legible. Ej: 14 -> "1 año y 2 meses". */
@Pipe({ name: 'age' })
export class AgePipe implements PipeTransform {
  transform(totalMonths: number): string {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const yearsText = years === 1 ? '1 año' : `${years} años`;
    const monthsText = months === 1 ? '1 mes' : `${months} meses`;

    if (years === 0) return monthsText;
    if (months === 0) return yearsText;
    return `${yearsText} y ${monthsText}`;
  }
}
