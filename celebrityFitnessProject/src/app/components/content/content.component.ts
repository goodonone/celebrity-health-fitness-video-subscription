import { ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { YoutubeService } from '../../services/youtube.service';
import { BehaviorSubject, debounceTime, fromEvent, Subject, Subscription, throttleTime } from 'rxjs';
// import { User } from 'src/app/models/user';
// import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})

export class ContentComponent implements OnInit{

  @ViewChild('cardSecondAndThirdTiers') cardSecondAndThirdTiers!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  @ViewChild('searchInput') 
  set searchInputSetter(element: ElementRef) {
    if (element) {
      this.searchInput = element;
      element.nativeElement.addEventListener('input', () => {
        this.resetSearchTimeout();
      });
    }
  }

  private scrollSubject = new Subject<void>();
  private bufferZone = 100;
  private scrollSubscription!: Subscription;
  private ticking = false;
  private lastKnownScrollPosition = 0;
  windowWidth: number = window.innerWidth;
  timerInitialized: boolean = false;
  private readonly EMPTY_INPUT_TIMEOUT = 10000; // 10 seconds
  private readonly FILLED_INPUT_TIMEOUT = 15000; // 15 seconds

  iaVideos: any[] = [];
  ifbVideos: any[] = [];
  ilbVideos: any[] = [];
  maVideos: any[] = [];
  mfbVideos: any[] = [];
  mlbVideos: any[] = [];
  aVideos: any[] = [];
  currentUser: User = new User;
  // timerVal = '';
  // timerValThree = '';
  userId?: string;
  heading:boolean = true;
  checked: boolean = false;
  timerTierThree: boolean = true;
  showLiveVideo: boolean = false;
  starterVideos: any[] = [];
  channel23Videos: any[] = [];
  channel22Videos: any[] = [];
  channel21Videos: any[] = [];
  channel20Videos: any[] = [];
  absVideos: any[] = [];
  lowerBodyVideos: any[] = [];
  fullBodyVideos: any[] = [];
  upperBodyVideos: any[] = [];
  hiitVideos: any[] = [];
  livestreamVideos: any[] = [];
  searchResults: any[] = [];
  foundVideos: boolean = false;
  // upgradeTimer: boolean = false;
  upgradeContainerVisible: boolean = false;
  timerBase: string = '';
  // timerVal: string = '';
  nextTimerVal: string = '';
  searchString: string = '';
  viewSearchBar: boolean = false;
  isSearchClicked: boolean = false;
  private searchTimeout: any;
  isSearching: boolean = false;
  isLoading: boolean = true;
  initialLoad: boolean = true;
  // timerValThree: string = '';

  private upgradeTimerSubject = new BehaviorSubject<boolean>(false);
  upgradeTimer$ = this.upgradeTimerSubject.asObservable();

  constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute, private ngZone: NgZone, private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer, private renderer: Renderer2) 
    { this.scrollSubject.pipe(
    debounceTime(50) 
  ).subscribe(() => {
    this.ngZone.run(() => this.checkScrollPosition());
  });
  this.windowWidth = window.innerWidth;
    }

  ngOnInit(): void {
    const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    // this.userId = parseInt(UserId);
    this.userId = UserId;
    this.userService.getUser(this.userId).subscribe(user => {
      this.currentUser = user;
      this.timerInitialized = true;
      this.startCountDown();

    const hasVisited = localStorage.getItem('contentLoaded');
    if (!hasVisited) {
      // Trigger animations
      this.initialLoad = true;
      // Store the flag in localStorage
      localStorage.setItem('contentLoaded', 'true');
    } else {
      // Skip animations
      this.initialLoad = false;
    }

    if(this.initialLoad) {
      setTimeout(() => {
        this.isLoading = false; 
      }, 3000)
      } else {
        this.isLoading = false;
      }



      // if(this.currentUser.tier === "Just Looking"){
      //   this.toggleHeading();
      //   const background = document.querySelector('.cardContainerTwo');
      //   background?.classList.add('upgradeBackground');
      //   const toggleArea = document.querySelector('.toggle-area');
      //   toggleArea?.classList.add('upgradeToggleArea');
      //   const buttonRecipes = document.querySelector('.btn-recipes');
      //   buttonRecipes?.classList.add('upgradeButtonRecipes');
      //   const showMore = document.querySelector('.btn-showMore');
      //   showMore?.classList.add('upgradeButtonShowMore');
      //   setTimeout(() => {
      //     const textColor = document.querySelector('.tierName');
      //     textColor?.classList.add('upgradeTierName');
      //   }, 0);
      // }
      // else{
      //   const background = document.querySelector('.cardContainerTwo');
      //   background?.classList.remove('upgradeBackground');
      //   const textColor = document.querySelector('.tierName');
      //   textColor?.classList.remove('upgradeTierName');
      //   const toggleArea = document.querySelector('.toggle-area');
      //   toggleArea?.classList.remove('upgradeToggleArea');
      //   const buttonRecipes = document.querySelector('.btn-recipes');
      //   buttonRecipes?.classList.remove('upgradeButtonRecipes');
      //   const showMore = document.querySelector('.btn-showMore');
      //   showMore?.classList.remove('upgradeButtonShowMore'); 

      // }
      if (this.currentUser.tier === "Just Looking") {
        this.applyJustLookingStyles();
      } else {
        this.removeJustLookingStyles();
      }
    });
   
    // this.startCountDownTierThree();
    this.checked = false;
    this.addToNewest();
    this.addToStarterVideos();
    this.addToCategory();
    this.addTolivestreamVideo();
    this.initScrollHandler();

    // document.body.style.backgroundColor = 'black';
  }
  
  ngAfterViewInit() {
    this.checkScrollPosition();
  }

  ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }

    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.removeEventListener('input', () => {
        this.resetSearchTimeout();
      });
    }
    // document.body.style.backgroundColor = 'white';
  }

  // @HostListener('window:scroll', ['$event'])
  // onWindowScroll() {
  //   this.scrollSubject.next();
  // }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.checkScrollPosition();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.windowWidth = window.innerWidth;
  }

  private initScrollHandler(): void {
    this.scrollSubscription = fromEvent(window, 'scroll')
      .pipe(throttleTime(16)) // ~60fps
      .subscribe(() => {
        this.lastKnownScrollPosition = window.scrollY;
        if (!this.ticking) {
          window.requestAnimationFrame(() => {
            this.checkScrollPosition();
            this.ticking = false;
          });
          this.ticking = true;
        }
      });
  }

  get upgradeTimer(): boolean {
    return this.upgradeTimerSubject.value;
  }

  set upgradeTimer(value: boolean) {
    this.upgradeTimerSubject.next(value);
  }


  // private checkScrollPosition(): void {
  //   if (this.currentUser.tier === "Just Looking") {
  //     const banner = document.querySelector('.bannerFirstAndSecondTiers') as HTMLElement;
  //     const card = this.cardSecondAndThirdTiers.nativeElement;

  //     if (!banner || !card) return;

  //     const bannerRect = banner.getBoundingClientRect();
  //     const cardRect = card.getBoundingClientRect();

  //     if (bannerRect.bottom >= cardRect.top - this.bufferZone) {
  //       if (!this.upgradeTimer) {
  //         this.upgradeTimer = true;
  //         this.showUpgradeContainer();
  //       }
  //     } else if (bannerRect.bottom < cardRect.top - this.bufferZone * 2) {
  //       if (this.upgradeTimer) {
  //         this.upgradeTimer = false;
  //         this.hideUpgradeContainer();
  //       }
  //     }
  //   }
  // }

  private checkScrollPosition(): void {
    if (this.currentUser.tier === "Just Looking") {
      const banner = document.querySelector('.bannerFirstAndSecondTiers') as HTMLElement;
      const card = this.cardSecondAndThirdTiers?.nativeElement;
      
      if (!banner || !card) return;

      const bannerRect = banner.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollThreshold = cardRect.top - this.bufferZone;

      // Only update if the state needs to change
      const shouldHide = bannerRect.bottom >= scrollThreshold;
      
      if (shouldHide !== this.upgradeTimer) {
        this.ngZone.run(() => {
          this.upgradeTimer = shouldHide;
          if (shouldHide) {
            this.showUpgradeContainer();
          } else {
            this.hideUpgradeContainer();
          }
          this.cdr.detectChanges();
        });
      }
    }
  }

  // showUpgradeContainer() {
  //   this.upgradeContainerVisible = true;
  //   this.upgradeTimer = true;
  //   this.cdr.detectChanges();
  //   setTimeout(() => {
  //     const container = document.querySelector('.upgradeContainer') as HTMLElement;
  //     if (container) {
  //       container.style.opacity = '1';
  //     }
  //   }, 50);
  // }

  private showUpgradeContainer(): void {
    if (!this.upgradeContainerVisible) {
      this.upgradeContainerVisible = true;
      this.upgradeTimer = true;
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const container = document.querySelector('.upgradeContainer') as HTMLElement;
        if (container) {
          container.style.opacity = '1';
        }
      });
    }
  }

  

  // hideUpgradeContainer() {
  //   this.upgradeTimer = false;
  //   this.cdr.detectChanges();
  //   const container = document.querySelector('.upgradeContainer') as HTMLElement;
  //   if (container) {
  //     container.style.opacity = '0';
  //     setTimeout(() => {
  //       this.upgradeContainerVisible = false;
  //       this.cdr.detectChanges();
  //     }, 300);
  //   }
  // }

  private hideUpgradeContainer(): void {
    if (this.upgradeContainerVisible) {
      const container = document.querySelector('.upgradeContainer') as HTMLElement;
      if (container) {
        container.style.opacity = '0';
        setTimeout(() => {
          this.upgradeTimer = false;
          this.upgradeContainerVisible = false;
          this.cdr.detectChanges();
        }, 300); // Match transition duration
      }
    }
  }

  private applyJustLookingStyles(): void {
    this.toggleHeading();
    this.addClassToElements('.cardContainerTwo', 'upgradeBackground');
    this.addClassToElements('.toggle-area', 'upgradeToggleArea');
    this.addClassToElements('.btn-recipes', 'upgradeButtonRecipes');
    this.addClassToElements('.btn-showMore', 'upgradeButtonShowMore');
    
    setTimeout(() => {
      this.addClassToElements('.tierName', 'upgradeTierName');
    }, 0);
  }

  private removeJustLookingStyles(): void {
    this.removeClassFromElements('.cardContainerTwo', 'upgradeBackground');
    this.removeClassFromElements('.toggle-area', 'upgradeToggleArea');
    this.removeClassFromElements('.btn-recipes', 'upgradeButtonRecipes');
    this.removeClassFromElements('.btn-showMore', 'upgradeButtonShowMore');
    this.removeClassFromElements('.tierName', 'upgradeTierName');
  }

  private addClassToElements(selector: string, className: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => this.renderer.addClass(el, className));
  }

  private removeClassFromElements(selector: string, className: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => this.renderer.removeClass(el, className));
  }

  // startCountDownTierOneTwo() {
  //   var countDownDate = new Date("October 31, 2024 16:45:25").getTime();

  //   // Update the count down every 1 second
  //   var x = setInterval( () => {

  //     // Get today's date and time
  //     var now = new Date().getTime();

  //     // Find the distance between now and the count down date
  //     var distance = countDownDate - now;

  //     // Time calculations for days, hours, minutes and seconds
  //     var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  //     var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  //     var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //     var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  //     // Display the result in the element with id="demo"
  //     // this.timerVal = "Next Live Workout in:" + " " + days + "d " + hours + "h "
  //     //   + minutes + "m " + seconds + "s. " + "Upgrade For Live Access!";
  //     this.timerVal = this.upgradeTimer
  //     ? "Next Live Workout in: " + days + "d " + hours + "h " + minutes + "m " + seconds + "s. "
  //     : "Next Live Workout in: " + days + "d " + hours + "h " + minutes + "m " + seconds + "s. " + "Upgrade For Live Access!";

  //     // If the count down is finished, write some text
  //     if (distance < 0) {
  //       clearInterval(x);
  //       this.timerVal  = "Live Video In Progress... Join Me Live!";
  //       // ngIf to open up a card for live video here
  //     }
  //   }, 1000);
  // }

  // startCountDownTierOneTwo() {
  //   const countDownDate = new Date("October 31, 2024 16:45:25").getTime();

  //   const updateTimer = () => {
  //     const now = new Date().getTime();
  //     const distance = countDownDate - now;

  //     if (distance < 0) {
  //       this.timerVal = "Live Video In Progress... Join Me Live!";
  //       this.nextTimerVal = this.timerVal;
  //       this.cdr.detectChanges();
  //       return;
  //     }

  //     const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  //     const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  //     const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //     const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  //     const baseText = `Next Live Workout in: ${days}d ${hours}h ${minutes}m ${seconds}s.`;
      
  //     this.timerVal = this.upgradeTimer ? baseText : `${baseText} Upgrade For Live Access!`;
      
  //     // Pre-calculate the next second's timer value
  //     const nextDistance = distance - 1000;
  //     if (nextDistance >= 0) {
  //       const nextDays = Math.floor(nextDistance / (1000 * 60 * 60 * 24));
  //       const nextHours = Math.floor((nextDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  //       const nextMinutes = Math.floor((nextDistance % (1000 * 60 * 60)) / (1000 * 60));
  //       const nextSeconds = Math.floor((nextDistance % (1000 * 60)) / 1000);
        
  //       const nextBaseText = `Next Live Workout in: ${nextDays}d ${nextHours}h ${nextMinutes}m ${nextSeconds}s.`;
  //       this.nextTimerVal = this.upgradeTimer ? nextBaseText : `${nextBaseText} Upgrade For Live Access!`;
  //     } else {
  //       this.nextTimerVal = "Live Video In Progress... Join Me Live!";
  //     }

  //     this.cdr.detectChanges();
  //   };

  //   // Initial update
  //   updateTimer();

  //   // Update every second
  //   setInterval(updateTimer, 1000);
  // }

  // startCountDown() {
  //   const countDownDate = new Date("October 31, 2024 16:45:25").getTime();

  //   const updateTimer = () => {
  //     const now = new Date().getTime();
  //     const distance = countDownDate - now;

  //     if (distance < 0) {
  //       this.timerBase = "Live Video In Progress...";
  //       if (this.currentUser?.tier === 'All In') {
  //         this.showLiveVideo = true;
  //       } else {
  //         this.timerBase += " Join Me Live!";
  //       }
  //       this.cdr.detectChanges();
  //       return;
  //     }

  //     const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  //     const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  //     const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //     const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  //     const timerBase = `Next Live Workout in: ${days}d ${hours}h ${minutes}m ${seconds}s.`;
      
  //     // if (this.currentUser?.tier === 'All In') {
  //     //   this.timerVal = baseText;
  //     // } else {
  //     //   this.timerVal = this.upgradeTimer ? baseText : `${baseText} Upgrade For Live Access!`;
  //     // }

  //     this.cdr.detectChanges();
  //   };

  //   // Initial update
  //   updateTimer();

  //   // Update every second
  //   setInterval(updateTimer, 1000);
  // }

  startCountDown() {
    const countDownDate = new Date("November 31, 2024 16:45:25").getTime();
  
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = countDownDate - now;
  
      if (distance < 0) {
        this.timerBase = "Live Video In Progress...";
        if (this.currentUser?.tier === 'All In') {
          this.showLiveVideo = true;
        } else {
          this.timerBase += " Join Me Live!";
          this.showLiveVideo = true;
        }
        this.cdr.detectChanges();
        return;
      }
  
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
      this.timerBase = `Next Live Workout in: ${days}d ${hours}h ${minutes}m ${seconds}s.`;
      
      this.cdr.detectChanges();
    };
  
    // Only start the timer if we have user data
    if (this.timerInitialized) {
      updateTimer();
      setInterval(updateTimer, 1000);
    }
  
  }




  // startCountDownTierThree() {
  //   var countDownDate = new Date("October 31, 2024 13:39:25").getTime();
  //   // var countDownDate = new Date("Jan 8, 2024 11:16:25").getTime();

  //   // Update the count down every 1 second
  //   var x = setInterval(() => {

  //     // Get today's date and time
  //     var now = new Date().getTime();

  //     // Find the distance between now and the count down date
  //     var distance = countDownDate - now;

  //     // Time calculations for days, hours, minutes and seconds
  //     var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  //     var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  //     var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //     var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  //     // Display the result in the element with id="demo"
  //     this.timerValThree = "Next Live Workout in:" + " " + days + "d " + hours + "h "
  //       + minutes + "m " + seconds + "s. ";

  //     // If the count down is finished, displayed text
  //     if (distance < 0) {
  //       clearInterval(x);
  //       this.timerValThree = "Live Video In Progress...";
  //       this.timerTierThree = false;
  //       this.showLiveVideo = true;
  //     }
  //   }, 1000);
  // }

  
  toggleView() {
    this.checked = !this.checked;
  }

  setChecked(value: boolean) {
    // if (this.checked !== value) {
      this.checked = value;
      this.toggleView();
    // }
  }


  getVideos(videoId: string, videoArray: any[]): void {
        videoArray.length = 0;
    
        this.youTubeService
        .getVideosById(videoId)
        .subscribe((list: any) => {
          for (const element of list.items) {
            const videoURL = 'https://www.youtube-nocookie.com/embed/' + element.id + '?autohide=1&rel=0';
            const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
            element.sanitizedURL = sanitizedURL;
            videoArray.push(element);
          }
        },
        error => {
          console.log('Error: ', error)
          if (error.status === 404 || error.status === 402) 
          this.router.navigate(['notfound']);
        });
    
      }

  getVideosFromPlaylist(playlistId: string, maxResults: string, videoArray: any[]): void {
    videoArray.length = 0;

    this.youTubeService
        .getVideosFromPlaylist(playlistId, maxResults)
        .subscribe(
            (list: any) => {
                for (const element of list.items) {
                    const videoURL = 'https://www.youtube-nocookie.com/embed/' + element.snippet.resourceId.videoId + '?autohide=1&rel=0';
                    const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
                    element.sanitizedURL = sanitizedURL;
                    videoArray.push(element);
                }
            },
            error => {
                console.error('Error: ', error);
                if (error.status === 404 || error.status === 402) {
                    this.router.navigate(['notfound']);
                }
            });
}

getVideosfromChannel(channelId: string, year: string, maxResults: string, videoArray: any[]): void {
  videoArray.length = 0;

  this.youTubeService
      .getVideosFromChannel(channelId, year, maxResults)
      .subscribe(
          (list: any) => {
              for (const element of list.items) {
                  const videoURL = 'https://www.youtube-nocookie.com/embed/' + element.id.videoId + '?autohide=1&rel=0';
                  const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
                  element.sanitizedURL = sanitizedURL;
                  videoArray.push(element);
              }
          },
          error => {
              console.error('Error: ', error);
              if (error.status === 404 || error.status === 402) {
                  this.router.navigate(['notfound']);
              }
          });
}

addToStarterVideos() {
  this.getVideos('Jf5_PJCFs-g', this.starterVideos);
  this.getVideos('BdhqubW1GJE', this.starterVideos);
  this.getVideos('zBkujDDdDkY', this.starterVideos);
  this.getVideos('4NOxBkzneyQ', this.starterVideos);
  this.getVideos('jIpRlynVMBo', this.starterVideos);
  this.getVideos('UCkzBmuABQo', this.starterVideos);
  this.getVideos('snA6ls2kG3U', this.starterVideos);
}

addToNewest() {
  this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2024', "8", this.channel23Videos)
  this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2023', "8", this.channel22Videos)
  this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2022', "8", this.channel21Videos)
  this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2021', "8", this.channel20Videos)
}


addToCategory() {
  this.getVideosFromPlaylist('PL2NpXBzdtNalexMUaoH09Yl9Bg5LHqUrs', "6" , this.absVideos);
  this.getVideosFromPlaylist('PL2NpXBzdtNaknMk_m4_a6Qj7P75ixno1Q', "6" , this.fullBodyVideos);
  this.getVideosFromPlaylist('PL2NpXBzdtNan-D0XhNEBRicxI52UsV1D5', "6" , this.upperBodyVideos);
  this.getVideosFromPlaylist('PL2NpXBzdtNaldC0EzXxxS-WyeadCvx7sg', "6" , this.hiitVideos);
}

addTolivestreamVideo() {
  this.getVideos('uBBDMqZKagY', this.livestreamVideos);
}

toggleHeading(){
  this.heading = !this.heading;
}

      // toggleSearch() {
      //   if (this.viewSearchBar) {
      //     this.viewSearchBar = false;
      //   } else {
      //     this.viewSearchBar = true;
      //   }
      //   setTimeout(() => {
      //     this.viewSearchBar = false;
      //   }, 10000);
      // }

      // toggleSearch() {
      //   this.viewSearchBar = !this.viewSearchBar;
      //   if (this.viewSearchBar) {
      //     this.resetSearchTimeout();
      //     setTimeout(() => {
      //       this.searchInput.nativeElement.focus();
      //     });
      //   }
      // }

  toggleSearch() {
    this.viewSearchBar = !this.viewSearchBar;
    if (this.viewSearchBar) {
      this.resetSearchTimeout();
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
      });
    }
  }

  // handleSearchIconClick() {
  //   if (this.viewSearchBar) {
  //     this.search();
  //   } else {
  //     this.toggleSearch();
  //   }
  // }

  // handleSearchIconClick() {
  //   const inputElement = this.searchInput?.nativeElement as HTMLInputElement;
    
  //   if (this.viewSearchBar && inputElement) {
  //     // If search bar is visible and has content, perform search
  //     if (inputElement.value.trim()) {
  //       this.search();
  //     } else {
  //       // If search bar is empty, hide it
  //       this.hideSearchBar();
  //     }
  //   } else {
  //     // Show search bar
  //     this.showSearchBar();
  //   }
  // }

  handleSearchIconClick() {
    const inputElement = this.searchInput?.nativeElement as HTMLInputElement;
    const inputValue = inputElement?.value.trim();
    
    if (this.viewSearchBar) {
      // Search bar is visible
      if (inputValue) {
        // If there's content, perform search
        this.search();
      } else {
        // If empty, hide the search bar
        this.hideSearchBar();
      }
    } else {
      // Search bar is not visible, show it
      this.showSearchBar();
    }
  }

  // private showSearchBar() {
  //   this.viewSearchBar = true;
  //   this.cdr.detectChanges();
    
  //   // Focus the input after it's visible
  //   setTimeout(() => {
  //     if (this.searchInput?.nativeElement) {
  //       this.searchInput.nativeElement.focus();
  //     }
  //   });

  //   this.resetSearchTimeout();
  // }

  private showSearchBar() {
    this.viewSearchBar = true;
    const searchIcon = document.querySelector('.searchIcon');
    searchIcon?.classList.add('expanded');
    
    this.cdr.detectChanges();
    
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    });

    this.resetSearchTimeout();
  }

  // private hideSearchBar() {
  //   const searchIcon = document.querySelector('.searchIcon') as HTMLElement;
  //   searchIcon?.classList.remove('expanded');
  //   this.viewSearchBar = false;
  //   this.cdr.detectChanges();
    
  //   if (this.searchTimeout) {
  //     clearTimeout(this.searchTimeout);
  //   }
  // }

  private hideSearchBar() {
    const searchIcon = document.querySelector('.searchIcon') as HTMLElement;
    searchIcon?.classList.remove('expanded');
    this.viewSearchBar = false;
    
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Clear the input value when hiding
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }
    
    this.isSearchClicked = false;
    this.cdr.detectChanges();
  }


  // private resetSearchTimeout() {
  //   if (this.searchTimeout) {
  //     clearTimeout(this.searchTimeout);
  //   }
  //   this.searchTimeout = setTimeout(() => {
  //     const searchIcon = document.querySelector('.searchIcon') as HTMLElement;
  //     searchIcon?.classList.remove('expanded');
  //     this.viewSearchBar = false;
  //   }, 10000);
  // }

  // private resetSearchTimeout() {
  //   if (this.searchTimeout) {
  //     clearTimeout(this.searchTimeout);
  //   }
    
  //   this.searchTimeout = setTimeout(() => {
  //     const inputValue = this.searchInput?.nativeElement?.value.trim();
  //     if (!inputValue) {
  //       this.hideSearchBar();
  //     }
  //   }, 10000);
  // }

  private resetSearchTimeout() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    const inputValue = this.searchInput?.nativeElement?.value.trim();
    const timeoutDuration = inputValue ? this.FILLED_INPUT_TIMEOUT : this.EMPTY_INPUT_TIMEOUT;
    
    this.searchTimeout = setTimeout(() => {
      this.hideSearchBar();
    }, timeoutDuration);
  }

  // onSearchBlur() {
  //   setTimeout(() => {
  //     if (document.activeElement !== this.searchInput.nativeElement) {
  //       this.viewSearchBar = false;
  //     }
  //   }, 100);
  // }

  // onSearchBlur() {
  //   // Only hide on blur if the input is empty
  //   setTimeout(() => {
  //     if (document.activeElement !== this.searchInput?.nativeElement) {
  //       const inputValue = this.searchInput?.nativeElement?.value.trim();
  //       if (!inputValue) {
  //         this.hideSearchBar();
  //       }
  //     }
  //   }, 100);
  // }

  // onSearchBlur() {
  //   // Short timeout to allow click events to process first
  //   setTimeout(() => {
  //     if (document.activeElement !== this.searchInput?.nativeElement) {
  //       const inputValue = this.searchInput?.nativeElement?.value.trim();
  //       if (!inputValue) {
  //         // Only hide if the input is empty and we're not clicking the search icon
  //         if (!this.isSearchClicked) {
  //           this.hideSearchBar();
  //         }
  //       }
  //     }
  //   }, 100);
  // }

  onSearchBlur() {
    // Short timeout to allow click events to process first
    setTimeout(() => {
      if (document.activeElement !== this.searchInput?.nativeElement) {
        // Hide if we're not clicking the search icon
        if (!this.isSearchClicked) {
          this.hideSearchBar();
        }
      }
    }, 100);
  }



  goBack() {
    this.foundVideos = false;
  }    
    
      // Search Function(INCOMPLETE)
      // search(searchString: string) {
      //   var search = (<HTMLInputElement>document.getElementById('mySearch') ?? '')
      //     .value;
      //   if (search !== '') {
      //     var input = search.charAt(0).toUpperCase() + search.slice(1);
      //     this.router.navigate(['search'], { relativeTo: this.router.routerState.root.firstChild })
      //   } else {
      //     this.viewSearchBar = false;
      //   }
      // }
      // search() {
      //   if (this.searchString.trim()) {
      //     this.foundVideos = true;
      //     this.youTubeService.searchVideos(this.searchString).subscribe(
      //       (results: any) => {
      //         this.searchResults = results.items.map((item: any) => {
      //           const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
      //           item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
      //           return item;
      //         });
      //       },
      //       (error: any) => console.error('Error searching videos:', error)
      //     );
      //   }
      // }

      // search() {
      //   if (this.searchString.trim() === '') {
      //     this.viewSearchBar = false;
      //     this.foundVideos = false;
      //     this.searchResults = [];
      //     return;
      //   }
    
      //   this.foundVideos = true;
      //   this.youTubeService.searchVideos(this.searchString).subscribe(
      //     (results: any) => {
      //       this.searchResults = results.items.map((item: any) => {
      //         const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
      //         item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
      //         return item;
      //       });
      //     },
      //     (error: any) => console.error('Error searching videos:', error)
      //   );
      // }

      // search() {
      //   if (this.searchString.trim() === '') {
      //     this.toggleSearch();
      //     return;
      //   }
    
      //   this.foundVideos = true;
      //   this.youTubeService.searchVideos(this.searchString).subscribe(
      //     (results: any) => {
      //       this.searchResults = results.items.map((item: any) => {
      //         const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
      //         item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
      //         return item;
      //       });
      //     },
      //     (error: any) => console.error('Error searching videos:', error)
      //   );
      //   this.resetSearchTimeout();
      // }

      // search() {
      //   if (this.searchString.trim() === '') {
      //     this.toggleSearch();
      //     return;
      //   }
    
      //   this.foundVideos = true;
      //   this.youTubeService.searchVideos(this.searchString).subscribe(
      //     (results: any) => {
      //       this.searchResults = results.items.map((item: any) => {
      //         const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
      //         item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
      //         return item;
      //       });
      //     },
      //     error => {
      //     console.error('Error searching videos:', error)
      //     this.searchResults = [];
      //     }
      //   );
      //   this.resetSearchTimeout();
      // }

      // search() {
      //   if (this.searchString.trim() === '') {
      //     this.toggleSearch();
      //     return;
      //   }
      
      //   this.foundVideos = true;
      //   this.isSearching = true;
      //   this.searchResults = [];
    
      //   this.youTubeService.searchVideosInChannel(this.searchString).subscribe(
      //     (results: any) => {
      //       this.searchResults = results.items.map((item: any) => {
      //         const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
      //         item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
      //         return item;
      //       });
      //       this.isSearching = false;
      //       // const searchIcon = document.querySelector('.searchIcon');
      //       // searchIcon?.classList.remove('expanded');
      //     },
      //     error => {
      //       console.error('Error searching videos:', error);
      //       this.searchResults = [];
      //       this.isSearching = false;
      //     }
      //   );
      //   this.resetSearchTimeout();
      // }

  // search() {
  //   if (this.searchString.trim() === '') {
  //     // If the search string is empty, hide the search input
  //     const searchIcon = document.querySelector('.searchIcon') as HTMLElement;
  //     searchIcon?.classList.remove('expanded');
  //     this.viewSearchBar = false;
  //     if (this.searchTimeout) {
  //       clearTimeout(this.searchTimeout);
  //     }
  //     return;
  //   }
  
  //   this.foundVideos = true;
  //   this.isSearching = true;
  //   this.searchResults = [];
  
  //   this.youTubeService.searchVideosInChannel(this.searchString).subscribe(
  //     (results: any) => {
  //       this.searchResults = results.items.map((item: any) => {
  //         const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
  //         item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
  //         return item;
  //       });
  //       this.isSearching = false;
  //     },
  //     error => {
  //       console.error('Error searching videos:', error);
  //       this.searchResults = [];
  //       this.isSearching = false;
  //     }
  //   );
  
  //   // After initiating the search, hide the search input immediately
  //   const searchIcon = document.querySelector('.searchIcon') as HTMLElement;
  //   searchIcon?.classList.remove('expanded');
  //   this.viewSearchBar = false;
  
  //   // Clear any existing timeouts
  //   if (this.searchTimeout) {
  //     clearTimeout(this.searchTimeout);
  //   }
  
  //   // Optionally, clear the input value
  //   this.searchString = '';
  // }

  search() {
    const searchString = this.searchInput?.nativeElement?.value.trim();
    
    if (!searchString) {
      this.hideSearchBar();
      return;
    }
  
    this.foundVideos = true;
    this.isSearching = true;
    this.searchResults = [];
  
    this.youTubeService.searchVideosInChannel(searchString).subscribe(
      (results: any) => {
        this.searchResults = results.items.map((item: any) => {
          const videoURL = 'https://www.youtube-nocookie.com/embed/' + item.id.videoId + '?autohide=1&rel=0';
          item.sanitizedURL = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
          return item;
        });
        this.isSearching = false;
        this.hideSearchBar();
      },
      error => {
        console.error('Error searching videos:', error);
        this.searchResults = [];
        this.isSearching = false;
        this.hideSearchBar();
      }
    );
  }


  // onMouseDown(button: string) {
  //   if (button === 'search') {
  //     this.isSearchClicked = true;
  //     const searchIcon = document.querySelector('.searchIcon');
  //     searchIcon?.classList.add('clicked');
  //     searchIcon?.classList.add('expanded');
  //   }
  // }

  // onMouseDown(button: string) {
  //   if (button === 'search') {
  //     this.isSearchClicked = true;
  //     const searchIcon = document.querySelector('.searchIcon');
  //     searchIcon?.classList.add('clicked');
  //     searchIcon?.classList.add('expanded');
  //     this.viewSearchBar = true; // Make sure the search bar is visible
  //     this.resetSearchTimeout(); // Start the 10-second timeout
  //   }
  // }

  // onMouseDown(button: string) {
  //   if (button === 'search') {
  //     this.isSearchClicked = true;
  //     const searchIcon = document.querySelector('.searchIcon');
  //     const inputElement = document.querySelector('.formSearch') as HTMLInputElement;
  //     const inputIsEmpty = inputElement?.value.trim() === '';
  
  //     if (searchIcon?.classList.contains('expanded')) {
  //       // The search bar is already visible
  //       if (inputIsEmpty) {
  //         // Input is empty, hide the input immediately
  //         searchIcon.classList.remove('expanded');
  //         this.viewSearchBar = false;
  //         if (this.searchTimeout) {
  //           clearTimeout(this.searchTimeout);
  //         }
  //       } else {
  //         // Input is not empty, proceed with your desired action (e.g., perform a search)
  //       }
  //     } else {
  //       // The search bar is not visible, show it
  //       searchIcon?.classList.add('clicked');
  //       searchIcon?.classList.add('expanded');
  //       this.viewSearchBar = true; // Ensure the search bar is visible
  //       this.resetSearchTimeout(); // Start the 10-second timeout
  //     }
  //   }
  // }  

  // onMouseDown(button: string) {
  //   if (button === 'search') {
  //     this.isSearchClicked = true;
  //     const searchIcon = document.querySelector('.searchIcon');
  //     const inputElement = document.querySelector('.formSearch') as HTMLInputElement;
  //     const inputIsEmpty = inputElement?.value.trim() === '';
  
  //     if (searchIcon?.classList.contains('expanded') && window.innerWidth <= 729) {
  //       // The search bar is already visible
  //       if (inputIsEmpty) {
  //         // Input is empty, hide the input immediately
  //         searchIcon.classList.remove('expanded');
  //         this.viewSearchBar = false;
  //         if (this.searchTimeout) {
  //           clearTimeout(this.searchTimeout);
  //         }
  //       } else {
  //         // Input is not empty, perform the search and hide the input
  //         this.search();
  //       }
  //     } else {
  //       // The search bar is not visible, show it
  //       searchIcon?.classList.add('clicked');
  //       searchIcon?.classList.add('expanded');
  //       this.viewSearchBar = true; // Ensure the search bar is visible
  //       this.resetSearchTimeout(); // Start the 10-second timeout
  //     }
  //   }
  // }

  // onMouseDown(button: string) {
  //   if (button === 'search') {
  //     this.isSearchClicked = true;
  //     const searchIcon = document.querySelector('.searchIcon');
      
  //     if (searchIcon?.classList.contains('expanded')) {
  //       const inputValue = this.searchInput?.nativeElement?.value.trim();
  //       if (!inputValue) {
  //         this.hideSearchBar();
  //         return;
  //       }
  //     }
      
  //     searchIcon?.classList.add('clicked');
  //     searchIcon?.classList.add('expanded');
  //   }
  // }

  // onMouseDown(button: string) {
  //   if (button === 'search') {
  //     this.isSearchClicked = true;
  //     const searchIcon = document.querySelector('.searchIcon');
  //     const inputElement = this.searchInput?.nativeElement as HTMLInputElement;
  //     const inputIsEmpty = !inputElement?.value.trim();
      
  //     if (searchIcon?.classList.contains('expanded')) {
  //       if (inputIsEmpty) {
  //         // If input is empty and expanded, hide it
  //         this.hideSearchBar();
  //         return;
  //       }
  //     }
      
  //     searchIcon?.classList.add('clicked');
  //     searchIcon?.classList.add('expanded');
  //   }
  // }

  onMouseDown(button: string) {
    if (button === 'search') {
      const searchIcon = document.querySelector('.searchIcon');
      searchIcon?.classList.add('clicked');
      
      // Only add expanded class if we're showing the search bar
      if (!this.viewSearchBar) {
        searchIcon?.classList.add('expanded');
      }
      
      this.isSearchClicked = true;
    }
  }

  onMouseUp(button: string) {
    if (button === 'search') {
    this.resetButtonState(button);
    }
  }

  // onSearchIconClick() {
  //   this.isSearchClicked = true;
  //   const searchIcon = document.querySelector('.searchIcon');
  //   searchIcon?.classList.add('clicked');
  //   searchIcon?.classList.add('expanded');
  //   this.viewSearchBar = true; // Ensure the search bar is visible
  //   this.resetSearchTimeout(); // Start the timeout
  //   // if(this.isSearchClicked){
  //   //   searchIcon?.classList.remove('expanded');
  //   // }
  // }

  onMouseLeave(button: string) {
    if (button === 'search') {
    this.resetButtonState(button);
    }
  }

  resetButtonState(button: string) {
    if (button === 'search') {
      this.isSearchClicked = false;
      const searchIcon = document.querySelector('.searchIcon');
      searchIcon?.classList.remove('clicked');
      // searchIcon?.classList.remove('expanded');
    }
  }

 

}






















 

  



