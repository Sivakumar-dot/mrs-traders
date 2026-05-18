import { Component, input, output } from '@angular/core';
import { MenuItemComponent } from '../menu-item/menu-item.component';

type MenuLink = {
  label: string;
  path: string;
};

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MenuItemComponent],
  template: `
    <nav
      [class]="footer() ? footerNavClass : mobile() ? mobileNavClass : desktopNavClass"
      [attr.aria-label]="ariaLabel()"
    >
      @for (item of items(); track item.label) {
        <span (click)="itemSelected.emit()">
          <app-menu-item
            [label]="item.label"
            [path]="item.path"
            [mobile]="mobile()"
            [footer]="footer()"
          />
        </span>
      }
    </nav>
  `
})
export class MenuComponent {
  readonly items = input.required<MenuLink[]>();
  readonly mobile = input(false);
  readonly footer = input(false);
  readonly ariaLabel = input('Primary');
  readonly itemSelected = output<void>();

  protected readonly desktopNavClass = 'hidden items-center gap-8 lg:flex';
  protected readonly mobileNavClass = 'mx-auto flex max-w-7xl flex-col gap-3';
  protected readonly footerNavClass = 'flex flex-col gap-3';
}
