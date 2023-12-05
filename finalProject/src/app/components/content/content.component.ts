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
  userId: string = "";

  constructor(private youTubeService: YoutubeService, private router: Router, private userService: UserService, private _sanitizer: DomSanitizer, private actRoute: ActivatedRoute) { }

  ngOnInit() { 
    const routeId = this.actRoute.snapshot.paramMap.get("id") ?? "";
     
    this.userId = routeId;

    this.userService.getUser(this.userId).subscribe( user => {
      this.currentUser = user
    });

    this.listOfInterested();
    this.listOfMotivated();
    this.listOfAllIn();

  }

  listOfInterested() {
    this.iVideos = [];
    this.youTubeService
      .getVideosForChanel('UCiP6wD_tYlYLYh3agzbByWQ', "1")
      .subscribe((list: any) => {
        for (const element of list.items) {
          const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
          const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
          element.sanitizedURL = sanitizedURL;
          this.iVideos.push(element);
        }
      },
      error => {
        console.log('Error: ', error)
        if (error.status === 404 || error.status === 402) 
        this.router.navigate(['notfound']);
      });
  }

  listOfMotivated() {
    console.log('Calling listOfMotivated');
    this.mVideos = [];
    this.youTubeService
      .mgetVideosForChanel('UCXtE168z7GAxYKAIHFOgm8w', "1")
      .subscribe((mlist: any) => {
        for (const melement of mlist.items) {
          const mvideoURL = 'https://www.youtube.com/embed/' + melement.id.videoId;
          const msanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(mvideoURL);
          melement.sanitizedURL = msanitizedURL;
          this.mVideos.push(melement);
        }
      },
      error => {
        console.log('Error: ', error)
        if (error.status === 404 || error.status === 402) 
        this.router.navigate(['notfound']);
      });
  }

  listOfAllIn() {
    this.aVideos = [];
    this.youTubeService
      .getVideosForChanel('UCXtE168z7GAxYKAIHFOgm8w', "1")
      .subscribe((list: any) => {
        for (const element of list.items) {
          const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
          const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
          element.sanitizedURL = sanitizedURL;
          this.aVideos.push(element);
        }
      },
      error => {
        console.log('Error: ', error)
        if (error.status === 404 || error.status === 402) 
        this.router.navigate(['notfound']);
      });
  }

  

}
