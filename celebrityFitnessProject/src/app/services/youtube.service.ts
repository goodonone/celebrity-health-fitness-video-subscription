import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class YoutubeService {

  // apiKey : string = "AIzaSyBp8YWYpjuQCBHe4oT0G7tky8giCQXNMEQ";
  apiKey : string = "AIzaSyC5ec7xPUuyfS4_wuo9IupwKwMhQ0vJ3Oc";
  
  // apiKey : string = "AIzaSyDh2pnp4I6Ox33w7uxISsDrDTP4ZqnBvBg";

  private channelId: string = "UCXtE168z7GAxYKAIHFOgm8w";

  constructor(public http: HttpClient) { }

    getVideosById(video: string): Observable<Object> {
    let url = 'https://www.googleapis.com/youtube/v3/videos?key=' + this.apiKey + '&id=' + video + '&order=date&part=snippet&type=video';
    
 return this.http.get(url)
      .pipe(map((res) => {
        return res;
      }))
  }

  getVideosFromPlaylist(playlist: string, maxResults: string): Observable<Object> {
    let url ='https://www.googleapis.com/youtube/v3/playlistItems?key=' + this.apiKey + '&playlistId=' + playlist + '&part=snippet,contentDetails&maxResults=' + maxResults;
 return this.http.get(url)
      .pipe(map((res) => {
        return res;
      }))
  }

    getVideosFromChannel(channelId: string, year: string, maxResults: string): Observable<Object> {
    
   let url = 'https://www.googleapis.com/youtube/v3/search?key=' + this.apiKey + '&channelId=' + channelId + '&order=date&part=snippet&publishedBefore=' + (parseInt(year)+1) + '-01-01T00:00:00Z&type=video,id&maxResults=' + maxResults   
 return this.http.get(url)
      .pipe(map((res) => {
        return res;
      }))
  }


  // searchVideos(query: string): Observable<any> {
  //   const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${this.apiKey}`;
  //   return this.http.get(url);
  // }

  searchVideosInChannel(query: string): Observable<any> {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&channelId=${this.channelId}&key=${this.apiKey}`;
    return this.http.get(url);
  }

  // Keep the general search method if needed
  searchVideos(query: string): Observable<any> {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${this.apiKey}`;
    return this.http.get(url);
  }
  
}
