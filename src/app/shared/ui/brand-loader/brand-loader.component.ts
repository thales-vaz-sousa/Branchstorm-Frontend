import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '@core/ui/theme.service';

/**
 * Loader de marca do Branchstorm (SVG orbital + respiração), no tema atual.
 * Os arquivos são auto-contidos (arte embutida em base64) e já respeitam
 * `prefers-reduced-motion`.
 */
@Component({
  selector: 'app-brand-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="brand-loader">
      <img
        class="brand-loader__img"
        [src]="src()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        alt="Carregando Branchstorm" />
      @if (label()) {
        <figcaption>{{ label() }}</figcaption>
      }
    </figure>
  `,
  styles: [
    `
      :host {
        display: grid;
        place-items: center;
      }

      .brand-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        margin: 0;
        color: var(--muted);
        text-align: center;
      }

      .brand-loader__img {
        display: block;
      }

      .brand-loader figcaption {
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class BrandLoaderComponent {
  private readonly theme = inject(ThemeService);

  readonly size = input(120);
  readonly label = input('');

  protected readonly src = computed(() =>
    this.theme.isDark() ? 'brand/loader-dark.svg' : 'brand/loader-light.svg',
  );
}
