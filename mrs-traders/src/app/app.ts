import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { MenuComponent } from './components/menu/menu.component';
import { businessInfo, navItems } from './data/site-content';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url))
    ),
    { requireSync: true }
  );

  protected readonly currentYear = new Date().getFullYear();
  protected readonly isMenuOpen = signal(false);
  protected readonly navItems = navItems;
  protected readonly business = businessInfo;
  protected readonly isAdminRoute = computed(() => {
    this.navigationEnd();
    return this.router.url.startsWith('/admin');
  });
  protected readonly mobileMenuLabel = computed(() =>
    this.isMenuOpen() ? 'Close navigation menu' : 'Open navigation menu'
  );

  protected toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
