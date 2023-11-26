import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YoutubeService } from 'src/app/services/youtube.service';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent {

  videos: any[] = [];

  constructor(private youTubeService: YoutubeService, private router: Router, private _sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.videos = [];
    this.youTubeService
      .getVideosForChanel('UCXtE168z7GAxYKAIHFOgm8w', "15")
      .subscribe((list: any) => {
        for (const element of list.items) {
          const videoURL = 'https://www.youtube.com/embed/' + element.id.videoId;
          const sanitizedURL: SafeResourceUrl = this._sanitizer.bypassSecurityTrustResourceUrl(videoURL);
          element.sanitizedURL = sanitizedURL;
          this.videos.push(element);
        }
      },
      error => {
        console.log('Error: ', error)
        if (error.status === 404 || error.status === 402) 
        this.router.navigate(['notfound']);
      });
  }
}
