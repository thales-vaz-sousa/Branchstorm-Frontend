import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  ActivatedRoute,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BS_MENU } from '@shared/ui/menu/menu';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { BannerComponent } from '@shared/ui/banner/banner.component';
import { ToastStackComponent } from '@shared/ui/toast/toast-stack.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService, type LangCode } from '@core/i18n/i18n.service';
import { SessionStore } from '@core/auth/session.store';
import { LoadingStore } from '@core/ui/loading.store';
import { ThemeService, type ThemePreference } from '@core/ui/theme.service';
import { anyMockEnabled } from '@core/mock/mock-mode';
import { environment } from '@env/environment';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ...BS_MENU,
    IconComponent,
    BannerComponent,
    ToastStackComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly routeRoot = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly session = inject(SessionStore);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly loading = inject(LoadingStore);
  protected readonly environment = environment;
  protected readonly demoMode = anyMockEnabled() && !environment.production;
  protected readonly isTreeRoute = signal(this.router.url.includes('/ideias/'));
  private readonly titleKey = signal<string | null>(null);

  /** Ícone do topo: plantinha verde no claro, branca no escuro. */
  protected readonly brandIcon = computed(() =>
    this.theme.isDark() ? 'brand/leaf-white.png' : 'brand/leaf-green.png',
  );

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isTreeRoute.set(event.url.includes('/ideias/'));
        this.resolveTitleKey();
      }
    });

    // Na árvore, a página não rola: o scroll/wheel mexe só o mapa.
    effect(() => {
      const lock = this.isTreeRoute();
      document.documentElement.style.overflow = lock ? 'hidden' : '';
      document.body.style.overflow = lock ? 'hidden' : '';
    });

    // Título da aba no idioma atual (atualiza ao trocar de língua também).
    effect(() => {
      const key = this.titleKey();
      const lang = this.i18n.lang();
      document.title = key ? `${this.i18n.t(key)} · Branchstorm` : 'Branchstorm';
      void lang;
    });
  }

  /** Caminha até a rota mais profunda e pega a chave do título. */
  private resolveTitleKey(): void {
    let route = this.routeRoot.snapshot;

    while (route?.firstChild) {
      route = route.firstChild;
    }

    this.titleKey.set((route?.data?.['titleKey'] as string | undefined) ?? null);
  }

  protected setTheme(preference: ThemePreference): void {
    this.theme.set(preference);
  }

  protected setLang(code: LangCode): void {
    this.i18n.setLang(code);
  }

  protected logout(): void {
    this.session.clear();
    void this.router.navigate(['/entrar']);
  }
}
