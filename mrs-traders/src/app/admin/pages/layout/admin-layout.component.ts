import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth.service';

interface AdminNavigationItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navigationItems = computed<AdminNavigationItem[]>(() => [
    {
      label: 'Company Basic Details',
      route: '/admin/company-basic-details'
    },
    {
      label: 'Gallery',
      route: '/admin/gallery'
    },
    {
      label: 'Product Categories',
      route: '/admin/product-categories'
    },
    {
      label: 'Products',
      route: '/admin/products'
    }
  ]);

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/admin/login']);
  }
}
