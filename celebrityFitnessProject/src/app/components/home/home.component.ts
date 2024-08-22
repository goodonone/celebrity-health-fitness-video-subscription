import { Component, HostListener, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

interface videoPlaylist {
  videoSrc: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  bannerThree!: HTMLElement | null;
  bannerFour!: HTMLElement | null;
  navbar!: HTMLElement | null;
  menu!: HTMLElement | null;

  videos = [
    { videoSrc: "/assets/Videos/Man Video One.mp4" }, { videoSrc: "/assets/Videos/Man Video Two.mp4" },
    { videoSrc: "/assets/Videos/Woman Video Three.mp4" }, { videoSrc: "/assets/Videos/Man Video Four.mp4" }
  ];
  

  images = [
    { imageSrc: '/assets/Images/1.jpg', imageAlt: 'man 1', manName: 'Patrick 33, <i>Motivated</i>, North Carolina', imageText: '"I needed some desperate help and I got it and so much more!"' },
    { imageSrc: '/assets/Images/2.jpg', imageAlt: 'man 2', manName: 'Steven 28, <i>Motivated</i>, New Jersey', imageText: '"What can I say, this program was a godsend 🙌!!!"' },
    { imageSrc: '/assets/Images/3.jpg', imageAlt: 'man 3', manName: 'Alvin 40, <i>All In</i>, New York', imageText: '"This guy got me out of eating chips all day."' },
    { imageSrc: '/assets/Images/4.jpg', imageAlt: 'man 4', manName: 'Shermon 32, <i>Motivated</i>, Ohio', imageText: '"The best money I have spent in a long time. PERIOD."' },
    { imageSrc: '/assets/Images/5.jpg', imageAlt: 'man 5', manName: 'Jorge 38, <i>All In</i>, California', imageText: '"Hooooo! I got my six pack and got rid of that other six pack🤘"' },
    { imageSrc: '/assets/Images/6.jpg', imageAlt: 'man 6', manName: 'Billy 27, <i>Motivated</i>, Oregon', imageText: '"Just, Start!"' }
  ];

  ngOnInit(): void {
    this.bannerThree = document.getElementById('bannerThree');
    this.bannerFour = document.getElementById('bannerFour');
    this.navbar = document.getElementById('navbar');
    this.menu = document.querySelector('.menu'); 

    // Reset navbar state when navigating away
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.resetNavbarState();
      }
    });
  }

ngAfterViewInit(): void {
  // Autoplay videos
  const video = document.querySelector('video');
    if (video) {
      video.muted = true;
      video.play().catch(error => {
        console.error('Safari prevented the video from autoplaying:', error);
      });
    }
  }


  constructor(private router: Router){}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const bannerThreePosition = this.bannerThree?.getBoundingClientRect().top;
    const bannerFourPosition = this.bannerFour?.getBoundingClientRect().top;
    const navbarHeight = this.navbar?.offsetHeight;

    if (
      (bannerThreePosition! <= navbarHeight! && bannerThreePosition! >= -this.bannerThree!.offsetHeight) ||
      (bannerFourPosition! <= navbarHeight! && bannerFourPosition! >= -this.bannerFour!.offsetHeight)
    ) {
      this.navbar?.classList.add('black');
      this.menu?.classList.add('black'); 
  
      const navBarTextElements = document.querySelectorAll('.navBarText');
      navBarTextElements.forEach((element) => {
        element.classList.add('black');
      });
    } else {
      this.navbar?.classList.remove('black');
      this.menu?.classList.remove('black'); 
  
      const navBarTextElements = document.querySelectorAll('.navBarText');
      navBarTextElements.forEach((element) => {
        element.classList.remove('black');
      });
    }
  }

  resetNavbarState(): void {
    this.navbar?.classList.remove('black');
    this.menu?.classList.remove('black'); 
    const navBarTextElements = document.querySelectorAll('.navBarText');
    navBarTextElements.forEach((element) => {
      element.classList.remove('black');
    });
  }

}






