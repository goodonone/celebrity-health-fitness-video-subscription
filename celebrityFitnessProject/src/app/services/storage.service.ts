// src/app/services/storage.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly baseUrl = environment.apiUrl;

  generateImageUrl(userId: string, fileName: string): string {
    // Extract filename from Firebase URL if needed
    if (fileName.includes('firebase')) {
      const match = fileName.match(/profileImages\/[^\/]+\/([^?]+)/);
      if (match) {
        fileName = match[1];
      }
    }
    
    return `${this.baseUrl}/api/storage/profileImages/${userId}/${fileName}`;
  }

//   convertFirebaseUrl(firebaseUrl: string): string {
//     if (!firebaseUrl) return '';
    
//     // Log the incoming URL
//     console.log('Converting URL:', firebaseUrl);

//     // Check if it's already a proxied URL
//     if (firebaseUrl.includes(this.baseUrl)) {
//       console.log('URL is already proxied');
//       return firebaseUrl;
//     }

//     try {
//       // Extract the path components using regex
//       const regex = /profileImages\/([^\/]+)\/([^?]+)/;
//       const match = firebaseUrl.match(regex);

//       if (!match) {
//         console.log('No match found in URL');
//         return firebaseUrl;
//       }

//       const [_, userId, fileName] = match;
      
//       // Construct the proxied URL
//       const proxiedUrl = `${this.baseUrl}/api/storage/profileImages/${userId}/${fileName}`;
//       console.log('Converted to:', proxiedUrl);
      
//       return proxiedUrl;
//     } catch (e) {
//       console.error('Error converting Firebase URL:', e);
//       return firebaseUrl;
//     }
//   }

// convertFirebaseUrl(firebaseUrl: string): string {
//     if (!firebaseUrl) return '';
    
//     console.log('Converting URL:', firebaseUrl);

//     // Check if it's already a proxied URL
//     if (firebaseUrl.includes(this.baseUrl)) {
//       console.log('URL is already proxied');
//       return firebaseUrl;
//     }

//     try {
//       // Parse the encoded URL parameters
//       const url = new URL(firebaseUrl);
//       const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
      
//       // Extract userId and fileName from the path
//       const match = path.match(/profileImages\/([^\/]+)\/([^\/]+)/);
      
//       if (!match) {
//         console.log('No match found in path:', path);
//         return firebaseUrl;
//       }

//       const [_, userId, fileName] = match;
      
//       // Construct the proxied URL
//       const proxiedUrl = `${this.baseUrl}/api/storage/profileImages/${userId}/${fileName}`;
//       console.log('Converted to:', proxiedUrl);
      
//       return proxiedUrl;

//     } catch (e) {
//       console.error('Error converting Firebase URL:', e);
//       return firebaseUrl;
//     }
//   }

convertFirebaseUrl(url: string): string {
    if (!url) return '';
    
    // Skip conversion if not a Firebase Storage URL
    if (!url.includes('firebasestorage.googleapis.com')) {
      return url;
    }
    
    console.log('Converting URL:', url);

    // Check if it's already a proxied URL
    if (url.includes(this.baseUrl)) {
      console.log('URL is already proxied');
      return url;
    }

    try {
      // Parse the URL to extract components
      const urlObj = new URL(url);
      
      // Check if we have the expected path structure
      if (!urlObj.pathname.includes('/o/')) {
        console.log('Not a Firebase Storage URL structure');
        return url;
      }

      const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      
      // Extract userId and fileName from the path
      const match = path.match(/profileImages\/([^\/]+)\/([^\/]+)/);
      
      if (!match) {
        console.log('No match found in path:', path);
        return url;
      }

      const [_, userId, fileName] = match;
      
      // Construct the proxied URL
      const proxiedUrl = `${this.baseUrl}/api/storage/profileImages/${userId}/${fileName}`;
      console.log('Converted to:', proxiedUrl);
      
      return proxiedUrl;

    } catch (e) {
      console.error('Error converting Firebase URL:', e);
      // Return original URL if conversion fails
      return url;
    }
  }


}
