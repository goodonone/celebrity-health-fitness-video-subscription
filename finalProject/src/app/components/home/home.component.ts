import { Component, Input, OnInit } from '@angular/core';
import { homePageVideos } from 'src/app/Models/homePageVideos';


interface videos {
  videoSrc: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  // counter: number = 0;

  // show: boolean = false;

  @Input() autoPlay = false;
  @Input() videosPlaylist: videos[] = [];

  // videoBanner: any;

  selectedIndex = 0;

  foodImg: string = "/assets/Images/joseph-gonzalez-fdlZBWIP0aM-unsplash.jpg";

  videoPlaylist = [{
    "videoSrc": "/assets/Videos/AdobeStock_232001391_Video_HD_Preview.mp4", "videoSrc": "/assets/Videos/AdobeStock_232005252_Video_HD_Preview.mp4",
    "videoSrc": "/assets/Videos/AdobeStock_232002478_Video_HD_Preview.mp4", "videoSrc": "/assets/Videos/AdobeStock_232002022_Video_HD_Preview.mp4"
  }];

  // videoPlaylist: homePageVideos[] = [{ "src": "/assets/Videos/AdobeStock_232001391_Video_HD_Preview.mp4", "startTime": 0, "endTime": 8 },
  // { "src": "/assets/Videos/AdobeStock_232005252_Video_HD_Preview.mp4", "startTime": 8, "endTime": 14 },
  // { "src": "/assets/Videos/AdobeStock_232002478_Video_HD_Preview.mp4", "startTime": 14, "endTime": 20 },
  // { "src": "/assets/Videos/AdobeStock_232002022_Video_HD_Preview.mp4", "startTime": 21, "endTime": 28 }];


  images = [
    { imageSrc: '/assets/Images/1.jpg', imageAlt: 'man 1', manName: 'Patrick 33, North Carolina', imageText: '"I needed some desperate help and I got it and so much more!"' },
    { imageSrc: '/assets/Images/2.jpg', imageAlt: 'man 2', manName: 'Steven 28, New Jersey', imageText: '"What can I say, this program was a godsend 🙌!!!"' },
    { imageSrc: '/assets/Images/3.jpg', imageAlt: 'man 3', manName: 'Alvin 40, New York', imageText: '"This guy got me out of eating chips all day."' },
    { imageSrc: '/assets/Images/4.jpg', imageAlt: 'man 4', manName: 'Shermon 32, Ohio', imageText: '"The best money I have spent in a long time. Period!"' },
    { imageSrc: '/assets/Images/5.jpg', imageAlt: 'man 5', manName: 'Jorge 38, California', imageText: '"Hooooo! I got my six pack and got rid of that other six pack🤘"' },
    { imageSrc: '/assets/Images/6.jpg', imageAlt: 'man 6', manName: 'Billy 27, Oregon', imageText: '"Just, Start!"' }
  ]


  // <Code to lay sequence of videos in video tag

  ngOnInit(): void {

    if (this.autoPlay) {
      this.autoPlayVideos();
    }

  }

    //   const element = document.getElementById("sample");
    //   element?.addEventListener("click", listenerFunction);
    // }

    // Or this code
    //   <script type='text/javascript'>
    //     document.getElementById('myVideo').addEventListener('ended',myHandler,false);
    //     function myHandler(e) {
    //         // What you want to do after the event
    //     }
    // </script>



const videoBanner = document.getElementById("myVideo");
videoBanner?.addEventListener('ended', autoPlayVideos, false);

      function autoPlayVideos(e: any) {
  {
    this.onNextClick();
  }
}


autoPlayVideos(): void{

}

autoSlideImages(): void {
  setInterval(() => {
    this.onNextClick();
  }, this.slideInterval);
}


selectVideo(index: number): void {
  this.selectedIndex = index;
}


onNextClick(): void {
  if(this.selectedIndex === this.videosPlaylist.length - 1){
  this.selectedIndex = 0;
}
          else {
  this.selectedIndex++;
}
  };
      



}






