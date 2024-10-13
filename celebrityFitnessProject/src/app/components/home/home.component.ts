import { Component, HostListener, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { carouselImage } from 'src/app/components/home/carousel/carousel.component';
import { UserService } from 'src/app/services/user.service';

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
  userIsLoggedIn: boolean = false;
  // UserId: string = '';


  videos = [
    { videoSrc: "/assets/Videos/Man Video One.mp4" }, { videoSrc: "/assets/Videos/Man Video Two.mp4" },
    { videoSrc: "/assets/Videos/Woman Video Three.mp4" }, { videoSrc: "/assets/Videos/Man Video Four.mp4" }
  ];
  

  // images = [
  //   { imageSrc: '/assets/Images/1.jpg', imageAlt: 'man 1', manName: 'Patrick 33, <i class="highlight">Motivated</i>, North Carolina', imageText: '"I needed some desperate help and I got it and so much more!"' },
  //   { imageSrc: '/assets/Images/2.jpg', imageAlt: 'man 2', manName: 'Steven 28, <i>Motivated</i>, New Jersey', imageText: '"What can I say, this program was a godsend 🙌!!!"' },
  //   { imageSrc: '/assets/Images/3.jpg', imageAlt: 'man 3', manName: 'Alvin 40, <i>All In</i>, New York', imageText: '"This guy got me out of eating chips all day."' },
  //   { imageSrc: '/assets/Images/4.jpg', imageAlt: 'man 4', manName: 'Shermon 32, <i>Motivated</i>, Ohio', imageText: '"The best money I have spent in a long time. PERIOD."' },
  //   { imageSrc: '/assets/Images/5.jpg', imageAlt: 'man 5', manName: 'Jorge 38, <i>All In</i>, California', imageText: '"Hooooo! I got my six pack and got rid of that other six pack🤘"' },
  //   { imageSrc: '/assets/Images/6.jpg', imageAlt: 'man 6', manName: 'Billy 27, <i>Motivated</i>, Oregon', imageText: '"Just, Start!"' }
  // ];

  images: carouselImage[] = [
    {
      imageSrc: '/assets/Images/1.jpg',
      imageAlt: 'man 1',
      manNameBefore: 'Patrick 33,',
      manNameHighlighted: 'Motivated',
      manNameAfter: 'North Carolina',
      highlightClass: 'motivatedClass',
      imageText: '"I needed some desperate help and I got it and so much more!"'
    },
    {
      imageSrc: '/assets/Images/2.jpg',
      imageAlt: 'man 2',
      manNameBefore: 'Steven 28,',
      manNameHighlighted: 'Motivated',
      manNameAfter: 'New Jersey',
      highlightClass: 'motivatedClass',
      imageText: '"What can I say, this program was a godsend 🙌!!!"'
    },
    {
      imageSrc: '/assets/Images/3.jpg',
      imageAlt: 'man 3',
      manNameBefore: 'Alvin 40,',
      manNameHighlighted: 'All In',
      manNameAfter: 'New York',
      highlightClass: 'allInClass',
      imageText: '"This guy got me out of eating chips all day."'
    },
    { imageSrc: '/assets/Images/4.jpg', 
      imageAlt: 'man 4', 
      manNameBefore: 'Shermon 32,',
      manNameHighlighted: 'Motivated',
      manNameAfter: 'Ohio',
      highlightClass: 'motivatedClass', 
      imageText: '"The best money I have spent in a long time. PERIOD."'
    },
    { 
      imageSrc: '/assets/Images/5.jpg', 
      imageAlt: 'man 5', 
      manNameBefore: 'Jorge 38,', 
      manNameHighlighted: 'All In', 
      manNameAfter: 'California', 
      highlightClass: 'allInClass',
      imageText: '"Hooooo! I got my six pack and got rid of that other six pack🤘"' 
    },
    { 
      imageSrc: '/assets/Images/6.jpg', 
      imageAlt: 'man 6', 
      manNameBefore: 'Billy 27,', 
      manNameHighlighted: 'Motivated', 
      manNameAfter:'Oregon', 
      highlightClass: 'motivatedClass',
      imageText: '"Just, Start!"' }
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

    this.UpdateStatus();
    
    this.userService.isLoggedIn$.subscribe(status => {
      this.userIsLoggedIn = status;
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


  constructor(private router: Router, private userService: UserService){}

  // Navbar color effect on scroll when navbar is above specific divs (which share navbar color)
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const bannerThreePosition = this.bannerThree?.getBoundingClientRect().top;
    const bannerFourPosition = this.bannerFour?.getBoundingClientRect().top;
    const navbarHeight = this.navbar?.offsetHeight;

    if (
      (bannerThreePosition! <= navbarHeight! && bannerThreePosition! >= -this.bannerThree!.offsetHeight) ||
      (bannerFourPosition! <= navbarHeight! && bannerFourPosition! >= -this.bannerFour!.offsetHeight)
    ) {
      this.navbar?.classList.add('shadow');
      this.menu?.classList.add('shadow'); 
  
      const navBarTextElements = document.querySelectorAll('.navBarText');
      navBarTextElements.forEach((element) => {
        element.classList.add('shadow');
      });
    } else {
      this.navbar?.classList.remove('shadow');
      this.menu?.classList.remove('shadow'); 
  
      const navBarTextElements = document.querySelectorAll('.navBarText');
      navBarTextElements.forEach((element) => {
        element.classList.remove('shadow');
      });
    }
  }

  resetNavbarState(): void {
    this.navbar?.classList.remove('shadow');
    this.menu?.classList.remove('shadow'); 
    // const navBarTextElements = document.querySelectorAll('.navBarText');
    // navBarTextElements.forEach((element) => {
    //   element.classList.remove('shadow');
    // });
  }

  UpdateStatus() {
    this.userService.isloggedIn().subscribe(isLoggedIn => {
      this.userIsLoggedIn = isLoggedIn;
      if (this.userIsLoggedIn) {
        localStorage.setItem("isUserLoggedIn", "true");
      }
    })
    // this.userIsLoggedIn = this.userService.isloggedIn();
    
  }

  onLogout() {
    this.userService.logoutUser();
  }
}






