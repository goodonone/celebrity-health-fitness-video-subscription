import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { YoutubeService } from '../../services/youtube.service';
// import { User } from 'src/app/models/user';
// import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})

export class ContentComponent implements OnInit{

  iaVideos: any[] = [];
  ifbVideos: any[] = [];
  ilbVideos: any[] = [];
  maVideos: any[] = [];
  mfbVideos: any[] = [];
  mlbVideos: any[] = [];
  aVideos: any[] = [];
  currentUser: User = new User;
  timerVal = '';
  timerValThree = '';
  userId?: number;
  heading = true;

  constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const UserId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userId = parseInt(UserId);
    this.userService.getUser(this.userId).subscribe(user => {
      this.currentUser = user;
      console.log(this.currentUser.tier);
      // console.log(user);
    });
    this.startCountDownTierOneTwo();
    this.startCountDownTierThree();
    this.checked = false;
    this.addToNewest();
    this.addToStarterVideos();
    this.addToCategory();
    this.addTolivestreamVideo();

    if(this.currentUser.tier == "Just Looking"){
      console.log(this.currentUser.tier);
      this.toggleHeading();
    }

  }
    

    // Try to do this where the latest year updates automatically

    // const yearSpan = document.getElementById('#currentYear');
    // const currentYear = new Date();
    // yearSpan!.innerText = currentYear.getFullYear();


    // only run if Tier = 'Just Looking'
    // if(tierName == 'Just Looking')
    // var $ = require("jquery");
    // var wrap = $("#fixed");

    // wrap.on("scroll", (e: any) => {
        
    //   if (document.documentElement.scrollTop > 147) {
    //     wrap.addClass("fix-search");
    //   } else {
    //     wrap.removeClass("fix-search");
    //   }
      
    // });


    // var windw = this;

    // $.fn.followTo = function (pos: number) {
    //   var $this = this,
    //     $window = $(windw);

    //   $window.scroll(function (e: any) {
    //     if ($window.scrollTop() > pos) {
    //       $this.css({
    //         position: 'absolute',
    //         top: pos
    //       });
    //     } else {
    //       $this.css({
    //         position: 'fixed',
    //         top: 0
    //       });
    //     }
    //   });
    // };

    // $('#fixed').followTo(250);
    //   $(window).scroll(() =>{
    //     $("#fixed").css("top",Math.max(0,0-$(this).scrollTop()));
    // });
  


 
  timerTierThree: boolean = true;
  showLiveVideo: boolean = false;
  
  checked: boolean = false;
  // currentUser: User = new User;
  // Add logic to only show one timer based on tier

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
  // testCards: number[] = [1, 2, 3, 4, 5, 6, 7]
  // testCardsTwo: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50]
  // testCardsThree: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25]
  startCountDownTierOneTwo() {
    var countDownDate = new Date("Jan 8, 2024 16:45:25").getTime();

    // Update the count down every 1 second
    var x = setInterval( () => {

      // Get today's date and time
      var now = new Date().getTime();

      // Find the distance between now and the count down date
      var distance = countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      this.timerVal = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. " + "Upgrade For Live Access!"

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        this.timerVal  = "Live Video In Progress...";
        // ngIf to open up a card for live video here
      }
    }, 1000);
  }

  startCountDownTierThree() {
    var countDownDate = new Date("Jan 2, 2027 16:45:25").getTime();
    // var countDownDate = new Date("Jan 8, 2024 11:16:25").getTime();

    // Update the count down every 1 second
    var x = setInterval(() => {

      // Get today's date and time
      var now = new Date().getTime();

      // Find the distance between now and the count down date
      var distance = countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      this.timerValThree = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. ";

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        this.timerValThree = "Live Video In Progress...";
        this.timerTierThree = false;
        this.showLiveVideo = true;
      }
    }, 1000);
  }

  // Condition to display various items on page
  

  toggleBilling() {
    this.checked = !this.checked;
  }

  // Upgrade Follow scroll 


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
        
        // this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2023', "1", this.channel23Videos)
        this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2023', "8", this.channel23Videos)
        this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2022', "8", this.channel22Videos)
        this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2021', "8", this.channel21Videos)
        this.getVideosfromChannel('UCXtE168z7GAxYKAIHFOgm8w', '2020', "8", this.channel20Videos)
  
        
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

}






















 

  



