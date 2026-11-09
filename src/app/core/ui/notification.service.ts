import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
}

let nextId = 0;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.push(message, 'success', 3500);
  }

  info(message: string): void {
    this.push(message, 'info', 4500);
  }

  error(message: string): void {
    this.push(message, 'error', 7000);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(message: string, tone: ToastTone, duration: number): void {
    const toast: Toast = { id: ++nextId, message, tone };
    this._toasts.update((toasts) => [...toasts.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }
}
