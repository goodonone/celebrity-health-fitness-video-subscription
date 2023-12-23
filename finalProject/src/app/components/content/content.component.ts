import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YoutubeService } from 'src/app/services/youtube.service';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

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
  

  constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute) { }

  ngOnInit() { 
    const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userService.getUser(userId).subscribe(user => {
      this.currentUser = user;
      // console.log(user);
    });

    this.listOfInterested();
    this.listOfMotivated();
    this.listOfAllIn();

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

  listOfInterested() {
  
    this.getVideosFromPlaylist('PL2NpXBzdtNamI0UmG_iCS7pbGW6Uccdkm', "1" , this.iaVideos);
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

  



