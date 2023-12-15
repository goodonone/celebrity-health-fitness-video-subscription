import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class YoutubeService {

  apiKey : string = "AIzaSyBp8YWYpjuQCBHe4oT0G7tky8giCQXNMEQ";

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
  
  
}
