import { Component } from '@angular/core';
import { businessInfo, stats } from '../../data/site-content';

@Component({
  selector: 'app-about',
  standalone: true,
  templateUrl: './about.component.html'
})
export class AboutComponent {
  protected readonly business = businessInfo;
  protected readonly stats = stats;
}
