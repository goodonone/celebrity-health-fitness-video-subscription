// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
// import { YoutubeService } from 'src/app/services/youtube.service';
// import { User } from 'src/app/models/user';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-content',
//   templateUrl: './content.component.html',
//   styleUrls: ['./content.component.css']
// })
// export class ContentComponent implements OnInit{

  // iaVideos: any[] = [];
  // ifbVideos: any[] = [];
  // ilbVideos: any[] = [];
  // maVideos: any[] = [];
  // mfbVideos: any[] = [];
  // mlbVideos: any[] = [];
  // aVideos: any[] = [];
  // currentUser: User = new User;
  

//   constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute) { }

//   ngOnInit() { 
    // const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    // this.userService.getUser(userId).subscribe(user => {
    //   this.currentUser = user;
    //   console.log(user);
    // });

    // this.listOfInterested();
    // this.listOfMotivated();
    // this.listOfAllIn();

//   }

//   getVideos(videoId: string, videoArray: any[]): void {
//     videoArray.length = 0;

//     this.youTubeService
//     .getVideosById(videoId)
//     .subscribe((list: any) => {
//       for (const element of list.items) {
//         const videoURL = 'https://www.youtube-nocookie.com/embed/' + element.id + '?autohide=1&rel=0';
//         const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
//         element.sanitizedURL = sanitizedURL;
//         videoArray.push(element);
//       }
//     },
//     error => {
//       console.log('Error: ', error)
//       if (error.status === 404 || error.status === 402) 
//       this.router.navigate(['notfound']);
//     });

//   }

//   getVideosFromPlaylist(playlistId: string, maxResults: string, videoArray: any[]): void {
//     videoArray.length = 0;

//     this.youTubeService
//         .getVideosFromPlaylist(playlistId, maxResults)
//         .subscribe(
//             (list: any) => {
//                 for (const element of list.items) {
//                     const videoURL = 'https://www.youtube-nocookie.com/embed/' + element.snippet.resourceId.videoId + '?autohide=1&rel=0';
//                     const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
//                     element.sanitizedURL = sanitizedURL;
//                     videoArray.push(element);
//                 }
//             },
//             error => {
//                 console.error('Error: ', error);
//                 if (error.status === 404 || error.status === 402) {
//                     this.router.navigate(['notfound']);
//                 }
//             });
// }

//   listOfInterested() {
  
//     this.getVideosFromPlaylist('PL2NpXBzdtNamI0UmG_iCS7pbGW6Uccdkm', "1" , this.iaVideos);
//     this.getVideosFromPlaylist('PL2NpXBzdtNaknMk_m4_a6Qj7P75ixno1Q', "1" , this.ifbVideos);
//     this.getVideosFromPlaylist('PL2NpXBzdtNambi5AXgQK_mWRiePlaiw28', "1" , this.ilbVideos);

//   }

//   listOfMotivated() {
//     this.getVideosFromPlaylist('PL2NpXBzdtNamI0UmG_iCS7pbGW6Uccdkm', "3" , this.maVideos);
//     this.getVideosFromPlaylist('PL2NpXBzdtNaknMk_m4_a6Qj7P75ixno1Q', "3" , this.mfbVideos);
//     this.getVideosFromPlaylist('PL2NpXBzdtNambi5AXgQK_mWRiePlaiw28', "3" , this.mlbVideos);
//   }

//   listOfAllIn() {
//     this.getVideos('uBBDMqZKagY', this.aVideos);
//   }

 
  
// }















import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YoutubeService } from 'src/app/services/youtube.service';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

import * as $ from 'jquery';

interface JQuery {
  chosen(options?: any): JQuery;
}

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {
  // scrollTop: number;
  // count: any;

  constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userService.getUser(userId).subscribe(user => {
      this.currentUser = user;
      console.log(user);
    });
    this.startCountDownTierOneTwo();
    this.startCountDownTierThree();
    this.checked = false;

    this.listOfInterested();
    this.listOfMotivated();
    this.listOfAllIn();

    
    

    // Try to do this where the latest year updates automatically

    // const yearSpan = document.getElementById('#currentYear');
    // const currentYear = new Date();
    // yearSpan!.innerText = currentYear.getFullYear();


    // only run if Tier = 'Just Looking'
    // if(tierName == 'Just Looking')
    var $ = require("jquery");
    var wrap = $("#fixed");

    wrap.on("scroll", (e: any) => {
        
      if (document.documentElement.scrollTop > 147) {
        wrap.addClass("fix-search");
      } else {
        wrap.removeClass("fix-search");
      }
      
    });


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
  }


 
  timerTierThree: boolean = true;
  showLiveVideo: boolean = false;
  
  checked: boolean = false;
  currentUser: User = new User;
  // Add logic to only show one timer based on tier

  iaVideos: any[] = [];
  ifbVideos: any[] = [];
  ilbVideos: any[] = [];
  maVideos: any[] = [];
  mfbVideos: any[] = [];
  mlbVideos: any[] = [];

  aVideos: any[] = [];
  testCards: number[] = [1, 2, 3, 4, 5, 6, 7]
  testCardsTwo: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50]
  testCardsThree: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25]
  startCountDownTierOneTwo() {
    var countDownDate = new Date("Jan 7, 2024 15:37:25").getTime();

    // Update the count down every 1 second
    var x = setInterval(function () {

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
      document.getElementById("timer")!.innerHTML = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. " + "Upgrade For Live Access!"

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        document.getElementById("timer")!.innerHTML = "EXPIRED";
        // ngIf to open up a card for live video here
      }
    }, 1000);
  }

  startCountDownTierThree() {
    var countDownDate = new Date("Jan 7, 2024 15:37:25").getTime();

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
      document.getElementById("timerTierThree")!.innerHTML = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. ";

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        document.getElementById("timerTierThree")!.innerHTML = "EXPIRED";
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
    
      listOfInterested() {
      
        this.getVideosFromPlaylist('PL2NpXBzdtNamI0UmG_iCS7pbGW6Uccdkm', "7-" , this.iaVideos);
        this.getVideosFromPlaylist('PL2NpXBzdtNaknMk_m4_a6Qj7P75ixno1Q', "1" , this.ifbVideos);
        this.getVideosFromPlaylist('PL2NpXBzdtNambi5AXgQK_mWRiePlaiw28', "1" , this.ilbVideos);
    
      }
    
      listOfMotivated() {
        this.getVideosFromPlaylist('PL2NpXBzdtNamI0UmG_iCS7pbGW6Uccdkm', "3" , this.maVideos);
        this.getVideosFromPlaylist('PL2NpXBzdtNaknMk_m4_a6Qj7P75ixno1Q', "3" , this.mfbVideos);
        this.getVideosFromPlaylist('PL2NpXBzdtNambi5AXgQK_mWRiePlaiw28', "3" , this.mlbVideos);
      }
    
      listOfAllIn() {
        this.getVideos('uBBDMqZKagY', this.aVideos);
      }

}






















  // listOfInterested() {
  //   this.iVideos = [];
  //   this.youTubeService
  //     .getVideosForChanel('UCiP6wD_tYlYLYh3agzbByWQ', "1")
  //     .subscribe((list: any) => {
  //       for (const element of list.items) {
  //         const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
  //         const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
  //         element.sanitizedURL = sanitizedURL;
  //         this.iVideos.push(element);
  //       }
  //     },
  //     error => {
  //       console.log('Error: ', error)
  //       if (error.status === 404 || error.status === 402) 
  //       this.router.navigate(['notfound']);
  //     });
  // }

  // listOfMotivated() {
  //   console.log('Calling listOfMotivated');
  //   this.mVideos = [];
  //   this.youTubeService
  //     .getVideosForChanel('UCXtE168z7GAxYKAIHFOgm8w', "1")
  //     .subscribe((list: any) => {
  //       for (const element of list.items) {
  //         const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
  //         const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
  //         element.sanitizedURL = sanitizedURL;
  //         this.mVideos.push(element);
  //       }
  //     },
  //     error => {
  //       console.log('Error: ', error)
  //       if (error.status === 404 || error.status === 402) 
  //       this.router.navigate(['notfound']);
  //     });
  // }

  // listOfAllIn() {
  //   this.aVideos = [];
  //   this.youTubeService
  //     .getVideosForChanel('UCXtE168z7GAxYKAIHFOgm8w', "1")
  //     .subscribe((list: any) => {
  //       for (const element of list.items) {
  //         const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
  //         const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
  //         element.sanitizedURL = sanitizedURL;
  //         this.aVideos.push(element);
  //       }
  //     },
  //     error => {
  //       console.log('Error: ', error)
  //       if (error.status === 404 || error.status === 402) 
  //       this.router.navigate(['notfound']);
  //     });
  // }

  



