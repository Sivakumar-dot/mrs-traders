import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { businessInfo, features, stats, testimonials } from '../../data/site-content';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  protected readonly business = businessInfo;
  protected readonly stats = stats;
  protected readonly features = features;
  protected readonly testimonials = testimonials;
}
