import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
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
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isMenuOpen = signal(false);
  protected readonly navItems = navItems;
  protected readonly business = businessInfo;
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
