import { Component, Input, OnInit } from '@angular/core';

interface carouselImage{
  imageSrc: string;
  imageAlt: string;
  manName: string;
  imageText: string;
}

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {

@Input() images: carouselImage[] = []
@Input() indicators = true;

selectedIndex = 0;

ngOnInit(): void {
  
}

}
