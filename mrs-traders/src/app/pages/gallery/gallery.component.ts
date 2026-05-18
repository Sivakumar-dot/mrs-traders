import { Component } from '@angular/core';
import { gallery } from '../../data/site-content';

@Component({
  selector: 'app-gallery',
  standalone: true,
  templateUrl: './gallery.component.html'
})
export class GalleryComponent {
  protected readonly gallery = gallery;
}
