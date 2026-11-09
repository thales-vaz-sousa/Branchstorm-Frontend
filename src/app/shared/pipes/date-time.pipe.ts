import { Pipe, type PipeTransform } from '@angular/core';
import { formatDate, formatDateTime } from '@shared/utils/date.util';

@Pipe({ name: 'dateTime' })
export class DateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, mode: 'date' | 'datetime' = 'datetime'): string {
    if (!value) {
      return '—';
    }

    return mode === 'date' ? formatDate(value) : formatDateTime(value);
  }
}
