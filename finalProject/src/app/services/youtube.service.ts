import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class YoutubeService {

  apiKey : string = "AIzaSyC8HgZeANMbvGWteITQtnQFocK4Qbfa1rk";

  constructor(public http: HttpClient) { }

    getVideosForChanel(channel: string, maxResults: string): Observable<Object> {
    let url = 'https://www.googleapis.com/youtube/v3/search?key=' + this.apiKey + '&channelId=' + channel + '&order=date&part=snippet &type=video,id&maxResults=' + maxResults
    return this.http.get(url)
      .pipe(map((res) => {
        return res;
      }))
  }
}
