import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="path()"
      routerLinkActive="text-[var(--color-accent)]"
      [routerLinkActiveOptions]="path() === '/' ? { exact: true } : { exact: false }"
      [class]="footer() ? footerClass : mobile() ? mobileClass : desktopClass"
    >
      {{ label() }}
    </a>
  `
})
export class MenuItemComponent {
  readonly label = input.required<string>();
  readonly path = input.required<string>();
  readonly mobile = input(false);
  readonly footer = input(false);

  protected readonly desktopClass =
    'text-sm font-semibold tracking-[0.18em] text-slate-200 transition hover:text-[var(--color-accent)]';
  protected readonly mobileClass =
    'rounded-2xl border border-white/8 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]';
  protected readonly footerClass = 'text-slate-300 transition hover:text-white';
}
