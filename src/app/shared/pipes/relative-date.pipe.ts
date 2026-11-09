import { Pipe, type PipeTransform } from '@angular/core';
import { formatRelative } from '@shared/utils/date.util';

@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return value ? formatRelative(value) : '—';
  }
}
