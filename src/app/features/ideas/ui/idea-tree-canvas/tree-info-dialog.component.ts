import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import type { LinkResult } from '@shared/models/link.model';

export interface TreeInfoContributor {
  readonly code: string;
  readonly name: string;
  readonly count: number;
}

export interface TreeInfoDialogData {
  readonly root: LinkResult;
  /** Autor · data, já compostos pelo canvas. */
  readonly meta: string;
  readonly teamName: string;
  readonly contributors: readonly TreeInfoContributor[];
}

/** Sessão de infos da árvore (mobile ≤640px): o ⓘ da barra abre este diálogo
    em vez do card flutuante, como as demais sessões do app. Fecha com `true`
    quando o usuário pede para ir à equipe. */
@Component({
  selector: 'app-tree-info-dialog',
  imports: [DialogShellComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="
        'canvas.treeOf' | translate: { team: data.teamName || ('canvas.noTeam' | translate) }
      "
      (closed)="close(undefined)">
      <div class="tree-info">
        <h2 class="tree-info__title">{{ data.root.title }}</h2>
        @if (data.root.description) {
          <p class="tree-info__desc">{{ data.root.description }}</p>
        }
        <span class="tree-info__meta">{{ data.meta }}</span>

        @if (data.contributors.length > 0) {
          <div class="tree-info__section">
            <span class="tree-info__eyebrow">{{ 'canvas.contributors' | translate }}</span>
            <ul class="tree-info__list">
              @for (person of data.contributors; track person.code) {
                <li>
                  <span class="tree-info__name">{{ person.name }}</span>
                  <span class="tree-info__count">
                    {{ 'canvas.itemsCount' | translate: { count: person.count } }}
                  </span>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      <div dialogFooter class="tree-info__actions">
        <button appButton variant="outline" type="button" (click)="close(true)">
          {{ 'canvas.team' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .tree-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .tree-info__title {
        font-size: var(--text-2xl);
        line-height: 1.1;
      }

      .tree-info__desc {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--muted);
      }

      .tree-info__meta {
        font-size: var(--text-xs);
        color: var(--muted);
      }

      .tree-info__section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-top: var(--space-2);
        padding-top: var(--space-3);
        border-top: 1px solid var(--line);
      }

      .tree-info__eyebrow {
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--tink);
      }

      .tree-info__list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: var(--text-sm);
      }

      .tree-info__list li {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-2);
      }

      .tree-info__count {
        color: var(--muted);
        font-size: var(--text-xs);
      }

      .tree-info__actions {
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class TreeInfoDialogComponent {
  protected readonly data = inject<TreeInfoDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean | undefined>>(DialogRef);

  protected close(result: boolean | undefined): void {
    this.ref.close(result);
  }
}
