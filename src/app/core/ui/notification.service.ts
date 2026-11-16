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
    this.notify(message, 'success', 3500);
  }

  info(message: string): void {
    this.notify(message, 'info', 4500);
  }

  error(message: string): void {
    this.notify(message, 'error', 7000);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private notify(message: string, tone: ToastTone, duration: number): void {
    void this.showBrowserNotification(message)
      .then((shown) => {
        if (!shown) {
          this.push(message, tone, duration);
        }
      })
      .catch(() => this.push(message, tone, duration));
  }

  private async showBrowserNotification(message: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        return false;
      }

      const notification = new Notification('Branchstorm', {
        body: message,
        icon: 'brand/icon-color.png',
        silent: true,
      });

      setTimeout(() => notification.close(), 4500);
      return true;
    } catch {
      return false;
    }
  }

  private push(message: string, tone: ToastTone, duration: number): void {
    const toast: Toast = { id: ++nextId, message, tone };
    this._toasts.update((toasts) => [...toasts.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }
}
