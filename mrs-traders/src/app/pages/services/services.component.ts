import { Component } from '@angular/core';
import { services } from '../../data/site-content';

@Component({
  selector: 'app-services',
  standalone: true,
  templateUrl: './services.component.html'
})
export class ServicesComponent {
  protected readonly services = services;
}
