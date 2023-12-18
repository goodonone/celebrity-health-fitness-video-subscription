import { Component, OnInit } from '@angular/core';

interface videoPlaylist {
  videoSrc: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {


  videos = [
    { videoSrc: "/assets/Videos/AdobeStock_232001391_Video_HD_Preview.mp4" }, { videoSrc: "/assets/Videos/AdobeStock_232005252_Video_HD_Preview.mp4" },
    { videoSrc: "/assets/Videos/AdobeStock_232002478_Video_HD_Preview.mp4" }, { videoSrc: "/assets/Videos/AdobeStock_232002022_Video_HD_Preview.mp4" }
  ];
  

  images = [
    { imageSrc: '/assets/Images/1.jpg', imageAlt: 'man 1', manName: 'Patrick 33, Motivated, North Carolina', imageText: '"I needed some desperate help and I got it and so much more!"' },
    { imageSrc: '/assets/Images/2.jpg', imageAlt: 'man 2', manName: 'Steven 28, Motivated, New Jersey', imageText: '"What can I say, this program was a godsend 🙌!!!"' },
    { imageSrc: '/assets/Images/3.jpg', imageAlt: 'man 3', manName: 'Alvin 40, All In, New York', imageText: '"This guy got me out of eating chips all day."' },
    { imageSrc: '/assets/Images/4.jpg', imageAlt: 'man 4', manName: 'Shermon 32, Motivated, Ohio', imageText: '"The best money I have spent in a long time. PERIOD."' },
    { imageSrc: '/assets/Images/5.jpg', imageAlt: 'man 5', manName: 'Jorge 38, All In, California', imageText: '"Hooooo! I got my six pack and got rid of that other six pack🤘"' },
    { imageSrc: '/assets/Images/6.jpg', imageAlt: 'man 6', manName: 'Billy 27, Motivated, Oregon', imageText: '"Just, Start!"' }
  ];

  ngOnInit(): void {

  }


}






