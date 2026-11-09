import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Sobre o Projeto — página manchetada "tronco + ramos", no espírito da
 * landing. Conteúdo derivado do README (requisitos, arquitetura, evolução).
 */
@Component({
  selector: 'app-about-page',
  imports: [StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPage implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer: IntersectionObserver | null = null;

  private readonly onScroll = (): void => {
    const trunk = this.host.nativeElement.querySelector('.trunk') as HTMLElement | null;

    if (!trunk) {
      return;
    }

    const rect = trunk.getBoundingClientRect();
    const target = Math.min(Math.max(window.innerHeight * 0.65 - rect.top, 0), rect.height);
    trunk.style.setProperty('--h', `${target}px`);
  };

  ngOnInit(): void {
    const root = this.host.nativeElement;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    root.classList.add('js');
    const trunk = root.querySelector('.trunk');

    if (trunk) {
      this.onScroll();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll);
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('v');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    root.querySelectorAll('.ramo').forEach((branch: Element) => {
      this.observer?.observe(branch);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
  }
}
