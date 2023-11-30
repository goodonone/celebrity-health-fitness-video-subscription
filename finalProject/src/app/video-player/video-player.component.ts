import { Component, Input, OnInit } from '@angular/core';

interface videoPlaylist {
  videoSrc: string;
}

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit {

  @Input() autoPlay = false;
  @Input() videos: videoPlaylist[] = [];
  @Input() slideInterval = 5500;

  // currentVideo: number

  selectedIndex = 0;
  indexSelected = 0;
  i: number = 0;

  ngOnInit(): void {
    if (this.autoPlay) {
      this.autoPlayVideos();
    }
  }

  autoPlayVideos(): void {
    setInterval(() => {
      this.nextClick();
    }, this.slideInterval);
  }


  nextClick(): void {
    if (this.selectedIndex === this.videos.length - 1) {
      this.selectedIndex = 0;
    }
    else {
      this.selectedIndex++;
    }
  }

}

