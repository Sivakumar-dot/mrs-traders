import { Component } from '@angular/core';
import { products } from '../../data/site-content';

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.component.html'
})
export class ProductsComponent {
  protected readonly products = products;
}
