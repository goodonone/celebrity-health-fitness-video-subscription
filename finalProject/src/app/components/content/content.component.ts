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

  iVideos: any[] = [];
  mVideos: any[] = [];
  aVideos: any[] = [];
  currentUser: User = new User;
  

  constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute) { }

  ngOnInit() { 
    const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userService.getUser(userId).subscribe(user => {
      this.currentUser = user;
      console.log(user);
    });

    this.listOfInterested();
    this.listOfMotivated();
    this.listOfAllIn();

  }

  getVideos(channelId: string, maxResult: string, videoArray: any[]): void {
    videoArray.length = 0;

    this.youTubeService
    .getVideosForChanel(channelId, maxResult)
    .subscribe((list: any) => {
      for (const element of list.items) {
        const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
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

  listOfInterested() {
    this.getVideos('UCiP6wD_tYlYLYh3agzbByWQ', "10" , this.iVideos);
  }

  listOfMotivated() {
    this.getVideos('UCXtE168z7GAxYKAIHFOgm8w', "1", this.mVideos);
  }

  listOfAllIn() {
    this.getVideos('UCXtE168z7GAxYKAIHFOgm8w', "1", this.aVideos);
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

  

}
