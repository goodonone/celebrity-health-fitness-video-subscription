import { Component, OnInit } from '@angular/core';
import { homePageVideos } from 'src/app/Models/homePageVideos';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  // counter: number = 0;

  foodImg: string = "/assets/Images/joseph-gonzalez-fdlZBWIP0aM-unsplash.jpg";

  videoPlaylist: homePageVideos[] = [{ "src": "/assets/Videos/AdobeStock_232001391_Video_HD_Preview.mp4", "startTime": 0, "endTime": 8 },
  { "src": "/assets/Videos/AdobeStock_232005252_Video_HD_Preview.mp4", "startTime": 8, "endTime": 14 },
  { "src": "/assets/Videos/AdobeStock_232002478_Video_HD_Preview.mp4", "startTime": 14, "endTime": 20 },
  { "src": "/assets/Videos/AdobeStock_232002022_Video_HD_Preview.mp4", "startTime": 21, "endTime": 28 }];

  
  images = [
    { imageSrc: '/assets/Images/1.jpg', imageAlt: 'man 1', manName:'Patrick, 33, NC', imageText:'"I needed some desperate help and I got it and so much more!"'},
    { imageSrc: '/assets/Images/2.jpg', imageAlt: 'man 2', manName:'Steven, 28, NJ', imageText:'What can I say, this program was a godsend 🙌!!!'},
    { imageSrc: '/assets/Images/3.jpg', imageAlt: 'man 3', manName:'Alvin, 40, NY ', imageText:'This guy pulled me out of eating chips all day.'},
    { imageSrc: '/assets/Images/4.jpg', imageAlt: 'man 4', manName:'Shermon, 32, OH', imageText:'The best money I have spent in a long time period.' },
    { imageSrc: '/assets/Images/5.jpg', imageAlt: 'man 5', manName:'Jorge, 38, CA', imageText:'Hooooo! I got my six pack and got rid of that other six pack🤘' },
    { imageSrc: '/assets/Images/6.jpg', imageAlt: 'man 6', manName:'Billy, 27, OR', imageText:' Just, Start!' }
  ]



// <Code to lay sequence of videos in video tag

  ngOnInit(): void {
  //   ()=> {
  //     var video = (<HTMLVideoElement>document.getElementById('mySearch') ?? "");
  //     function playVideoSegments(videoPlaylist: string | any[]) {
  //       if (counter  <= videoPlaylist.length - 1) {
  //         // initialised counter to play video segments in the array    
  //         /*******************base case, first video ****************/
  //         //base case, playing first video segment in sequence
  //         var videoSrc = videoPlaylist[counter]['src'];
  //         var inPoint = videoPlaylist[counter]['startTime'];
  //         var outPoint = videoPlaylist[counter]['endTime'];
  //         // helper function to play one video segment
  //         video.src = videoSrc + "#t=" + inPoint + "," + outPoint;
  //         console.log(video.src);
  //         video.load;
  //         video.play();
  //         counter += 1;
      
  //         video.addEventListener("timeupdate", function() {
  //         if(counter <= videoPlaylist.length - 1){
  //             if (video.currentTime >= outPoint!) {
  //               videoSrc = videoPlaylist[counter]['src'];
  //               inPoint = videoPlaylist[counter]['startTime'];
  //               outPoint = videoPlaylist[counter]['endTime'];
  //               //    counter += 1;
  //               playVideoSegments(videoPlaylist);
  //             }
  //           }
  //         }, false);
  //       }
  //     }
      
  //   }




// Or this code
//   <script type='text/javascript'>
//     document.getElementById('myVideo').addEventListener('ended',myHandler,false);
//     function myHandler(e) {
//         // What you want to do after the event
//     }
// </script>

  





}



}

