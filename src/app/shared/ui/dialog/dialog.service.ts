import { type ComponentType } from '@angular/cdk/portal';
import { Dialog, type DialogConfig, type DialogRef } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, type ConfirmDialogData } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<R = unknown, D = unknown>(
    component: ComponentType<unknown>,
    config: Partial<DialogConfig<D, DialogRef<R, unknown>>> = {},
  ): DialogRef<R, unknown> {
    return this.dialog.open<R, D, unknown>(component, {
      panelClass: 'bs-dialog-panel',
      backdropClass: 'bs-dialog-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ...config,
    } as DialogConfig<D, DialogRef<R, unknown>>);
  }

  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, { data });
    return (await firstValueFrom(ref.closed)) ?? false;
  }
}
