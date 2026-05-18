import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      #routeActive="routerLinkActive"
      [routerLink]="path()"
      routerLinkActive="menu-active"
      [routerLinkActiveOptions]="path() === '/' ? { exact: true } : { exact: false }"
      [attr.aria-current]="routeActive.isActive ? 'page' : null"
      [class]="getItemClass(routeActive.isActive)"
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
    'rounded-ful text-sm font-semibold tracking-[0.18em] text-slate-200 transition hover:bg-white/5 hover:text-[var(--color-accent)]';
  protected readonly mobileClass =
    'rounded-2xl border border-white/8 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]';
  protected readonly footerClass =
    'rounded-xl px-2 py-1 text-slate-300 transition hover:text-white';

  protected getItemClass(isActive: boolean): string {
    const baseClass = this.footer()
      ? this.footerClass
      : this.mobile()
        ? this.mobileClass
        : this.desktopClass;

    if (!isActive) {
      return baseClass;
    }

    const activeClass = this.footer()
      ? ' text-white'
      : this.mobile()
        ? ' border-[var(--color-accent)] text-[var(--color-accent)]'
        : ' text-[var(--color-accent)]';

    return `${baseClass}${activeClass}`;
  }
}
