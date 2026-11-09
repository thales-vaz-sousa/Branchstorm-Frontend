const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
});

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', {
  numeric: 'auto',
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatRelative(value: string | Date): string {
  const date = new Date(value);
  const differenceInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(differenceInSeconds);

  if (absoluteSeconds < 60) {
    return relativeFormatter.format(differenceInSeconds, 'second');
  }

  const differenceInMinutes = Math.round(differenceInSeconds / 60);

  if (Math.abs(differenceInMinutes) < 60) {
    return relativeFormatter.format(differenceInMinutes, 'minute');
  }

  const differenceInHours = Math.round(differenceInMinutes / 60);

  if (Math.abs(differenceInHours) < 24) {
    return relativeFormatter.format(differenceInHours, 'hour');
  }

  const differenceInDays = Math.round(differenceInHours / 24);

  if (Math.abs(differenceInDays) < 30) {
    return relativeFormatter.format(differenceInDays, 'day');
  }

  const differenceInMonths = Math.round(differenceInDays / 30);

  if (Math.abs(differenceInMonths) < 12) {
    return relativeFormatter.format(differenceInMonths, 'month');
  }

  return relativeFormatter.format(Math.round(differenceInMonths / 12), 'year');
}
