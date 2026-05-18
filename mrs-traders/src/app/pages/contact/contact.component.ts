import { Component } from '@angular/core';
import { businessHours, businessInfo } from '../../data/site-content';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html'
})
export class ContactComponent {
  protected readonly business = businessInfo;
  protected readonly businessHours = businessHours;
}
