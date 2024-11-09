// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, catchError, map, throwError } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class YoutubeService {

//   private apiURL = 'http://localhost:3000/api/youtube';

//   // apiKey : string = "AIzaSyBp8YWYpjuQCBHe4oT0G7tky8giCQXNMEQ";
//   // apiKey : string = "AIzaSyC5ec7xPUuyfS4_wuo9IupwKwMhQ0vJ3Oc";
  
//   // apiKey : string = "AIzaSyDh2pnp4I6Ox33w7uxISsDrDTP4ZqnBvBg";

//   private channelId: string = "UCXtE168z7GAxYKAIHFOgm8w";

//   constructor(public http: HttpClient) { }

// getVideosById(video: string): Observable<Object> {
//     let url = 'https://www.googleapis.com/youtube/v3/videos?key=' + this.apiKey + '&id=' + video + '&order=date&part=snippet&type=video';
    
//  return this.http.get(url)
//       .pipe(map((res) => {
//         return res;
//       }))
//   }

//   getVideosFromPlaylist(playlist: string, maxResults: string): Observable<Object> {
//     let url ='https://www.googleapis.com/youtube/v3/playlistItems?key=' + this.apiKey + '&playlistId=' + playlist + '&part=snippet,contentDetails&maxResults=' + maxResults;
//  return this.http.get(url)
//       .pipe(map((res) => {
//         return res;
//       }))
//   }

//     getVideosFromChannel(channelId: string, year: string, maxResults: string): Observable<Object> {
    
//    let url = 'https://www.googleapis.com/youtube/v3/search?key=' + this.apiKey + '&channelId=' + channelId + '&order=date&part=snippet&publishedBefore=' + (parseInt(year)+1) + '-01-01T00:00:00Z&type=video,id&maxResults=' + maxResults   
//  return this.http.get(url)
//       .pipe(map((res) => {
//         return res;
//       }))
//   }


//   // searchVideos(query: string): Observable<any> {
//   //   const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${this.apiKey}`;
//   //   return this.http.get(url);
//   // }

//   searchVideosInChannel(query: string): Observable<any> {
//     const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&channelId=${this.channelId}&key=${this.apiKey}`;
//     return this.http.get(url);
//   }

//   // Keep the general search method if needed
//   searchVideos(query: string): Observable<any> {
//     const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${this.apiKey}`;
//     return this.http.get(url);
//   }

// getVideosById(videoId: string): Observable<any> {
//   const url = `${this.apiURL}/videos/${videoId}`;
//   return this.http.get(url);
// }

// getVideosFromPlaylist(playlistId: string, maxResults: string): Observable<any> {
//   const url = `${this.apiURL}/playlistItems?playlistId=${playlistId}&maxResults=${maxResults}`;
//   return this.http.get(url);
// }

// getVideosFromChannel(channelId: string, year: string, maxResults: string): Observable<any> {
//   const publishedBefore = `${parseInt(year) + 1}-01-01T00:00:00Z`;
//   const url = `${this.apiURL}/search?channelId=${channelId}&publishedBefore=${publishedBefore}&maxResults=${maxResults}`;
//   return this.http.get(url);
// }

// searchVideosInChannel(query: string): Observable<any> {
//   const url = `${this.apiURL}/search?query=${query}&channelId=${this.channelId}`;
//   return this.http.get(url);
// }

// searchVideos(query: string): Observable<any> {
//   const url = `${this.apiURL}/search?query=${query}`;
//   return this.http.get(url);
// }

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, catchError, map, throwError } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class YoutubeService {

//   private apiURL = 'http://localhost:3000/api/youtube';


// private channelId: string = "UCXtE168z7GAxYKAIHFOgm8w";

// constructor(public http: HttpClient) { }

//   getVideosById(videoId: string): Observable<any> {
//     const url = `${this.apiURL}/videos/${videoId}`;
//     return this.http.get(url).pipe(
//       catchError((error) => {
//         console.error('Error fetching video by ID:', error);
//         return throwError(() => error);
//       })
//     );
//   }


//   getVideosFromPlaylist(playlistId: string, maxResults: string): Observable<any> {
//     const url = `${this.apiURL}/playlistItems?playlistId=${playlistId}&maxResults=${maxResults}`;
//     return this.http.get(url).pipe(
//       catchError((error) => {
//         console.error('Error fetching videos from playlist:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   getVideosFromChannel(channelId: string, year: string, maxResults: string): Observable<any> {
//     const publishedBefore = `${parseInt(year) + 1}-01-01T00:00:00Z`;
//     const url = `${this.apiURL}/search?channelId=${channelId}&publishedBefore=${publishedBefore}&maxResults=${maxResults}`;
//     return this.http.get(url).pipe(
//       catchError((error) => {
//         console.error('Error fetching videos from channel:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   searchVideosInChannel(query: string): Observable<any> {
//     const url = `${this.apiURL}/search?query=${query}&channelId=${this.channelId}`;
//     return this.http.get(url).pipe(
//       catchError((error) => {
//         console.error('Error searching videos in channel:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   searchVideos(query: string): Observable<any> {
//     const url = `${this.apiURL}/search?query=${query}`;
//     return this.http.get(url).pipe(
//       catchError((error) => {
//         console.error('Error searching videos:', error);
//         return throwError(() => error);
//       })
//     );
//   }

  
// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private apiURL = 'http://localhost:3000/api/youtube';
  private channelId: string = "UCXtE168z7GAxYKAIHFOgm8w";

  constructor(private http: HttpClient) { }

  getVideosById(videoId: string): Observable<any> {
    const url = `${this.apiURL}/videos/${videoId}`;
    return this.http.get(url).pipe(
      catchError(this.handleError('Error fetching video by ID'))
    );
  }

  getVideosByCategory(categoryId: string, maxResults: string = '10'): Observable<any> {
    const url = `${this.apiURL}/videos/category/${categoryId}`;
    return this.http.get(url, {
      params: { maxResults }
    }).pipe(
      catchError(this.handleError('Error fetching videos by category'))
    );
  }

  getVideosFromPlaylist(playlistId: string, maxResults: string = '10'): Observable<any> {
    const url = `${this.apiURL}/playlistItems`;
    return this.http.get(url, {
      params: { playlistId, maxResults }
    }).pipe(
      catchError(this.handleError('Error fetching videos from playlist'))
    );
  }

  getVideosFromChannel(channelId: string = this.channelId, year: string, maxResults: string = '10'): Observable<any> {
    const url = `${this.apiURL}/search`;
    const publishedBefore = `${parseInt(year) + 1}-01-01T00:00:00Z`;
    return this.http.get(url, {
      params: {
        channelId,
        publishedBefore,
        maxResults,
        type: 'video'
      }
    }).pipe(
      catchError(this.handleError('Error fetching videos from channel'))
    );
  }

  searchVideosInChannel(query: string): Observable<any> {
    const url = `${this.apiURL}/search`;
    return this.http.get(url, {
      params: {
        query,
        channelId: this.channelId,
        type: 'video'
      }
    }).pipe(
      catchError(this.handleError('Error searching videos in channel'))
    );
  }

  searchVideos(query: string): Observable<any> {
    const url = `${this.apiURL}/search`;
    return this.http.get(url, {
      params: { query, type: 'video' }
    }).pipe(
      catchError(this.handleError('Error searching videos'))
    );
  }

  private handleError(message: string) {
    return (error: any): Observable<never> => {
      console.error(message, error);
      return throwError(() => error);
    };
  }
}