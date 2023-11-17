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

