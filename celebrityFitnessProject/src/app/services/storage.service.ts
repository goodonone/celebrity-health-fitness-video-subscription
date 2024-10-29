// src/app/services/storage.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly baseUrl = environment.apiUrl;

  // generateImageUrl(userId: string, fileName: string): string {
  //   // Extract filename from Firebase URL if needed
  //   if (fileName.includes('firebase')) {
  //     const match = fileName.match(/profileImages\/[^\/]+\/([^?]+)/);
  //     if (match) {
  //       fileName = match[1];
  //     }
  //   }
    
  //   return `${this.baseUrl}/api/storage/profileImages/${userId}/${fileName}`;
  // }
generateImageUrl(userId: string, fileName: string, isStaged: boolean = false): string {
  const pathPrefix = isStaged ? 'staging/' : '';
  return `${this.baseUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
}  


convertFirebaseUrl(url: string): string {
  if (!url) return '';
  
  // Skip conversion if not a Firebase Storage URL
  if (!url.includes('firebasestorage.googleapis.com')) {
    return url;
  }
  
  // Check if it's already a proxied URL
  if (url.includes(this.baseUrl)) {
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

    const fullPath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    
    // Check if this is a staged image
    const isStaged = fullPath.startsWith('staging/');

    // Extract path components
    const pathSegments = fullPath.split('/');
    let userId, fileName;
    
    if (isStaged) {
      // For staged images: staging/profileImages/userId/fileName
      userId = pathSegments[2];
      fileName = pathSegments[3];
    } else {
      // For permanent images: profileImages/userId/fileName
      userId = pathSegments[1];
      fileName = pathSegments[2];
    }
    
    if (!userId || !fileName) {
      return url;
    }

    // Construct the proxied URL maintaining the staging path if present
    const pathPrefix = isStaged ? 'staging/' : '';
    const proxiedUrl = `${this.baseUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
    
    return proxiedUrl;

  } catch (e) {
    console.error('Error converting Firebase URL:', e);
    return url;
  }
}

// convertFirebaseUrl(url: string): string {
//     if (!url) return '';
    
//     // Skip conversion if not a Firebase Storage URL
//     if (!url.includes('firebasestorage.googleapis.com')) {
//       return url;
//     }
    
//     // console.log('Converting URL:', url);

//     // Check if it's already a proxied URL
//     if (url.includes(this.baseUrl)) {
//       console.log('URL is already proxied');
//       return url;
//     }

//     try {
//       // Parse the URL to extract components
//       const urlObj = new URL(url);
      
//       // Check if we have the expected path structure
//       if (!urlObj.pathname.includes('/o/')) {
//         console.log('Not a Firebase Storage URL structure');
//         return url;
//       }

//       const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      
//       // Check if this is a staged image
//       const isStaged = fullPath.startsWith('staging/');

//       // Extract path components
//       const pathSegments = fullPath.split('/');
//       let userId, fileName;
      
//       if (isStaged) {
//         // For staged images: staging/profileImages/userId/fileName
//         userId = pathSegments[2];
//         fileName = pathSegments[3];
//       } else {
//         // For permanent images: profileImages/userId/fileName
//         userId = pathSegments[1];
//         fileName = pathSegments[2];
//       }
      
//       if (!userId || !fileName) {
//         return url;
//       }

//   //     // Extract userId and fileName from the path
//   //     const match = path.match(/profileImages\/([^\/]+)\/([^\/]+)/);
      
//   //     if (!match) {
//   //       console.log('No match found in path:', path);
//   //       return url;
//   //     }

//   //     const [_, userId, fileName] = match;
      
//   //     // Construct the proxied URL
//   //     const proxiedUrl = `${this.baseUrl}/api/storage/profileImages/${userId}/${fileName}`;
//   //     // console.log('Converted to:', proxiedUrl);
      
//   //     return proxiedUrl;

//   //   } catch (e) {
//   //     console.error('Error converting Firebase URL:', e);
//   //     // Return original URL if conversion fails
//   //     return url;
//   //   }
//   // }
//   // Construct the proxied URL maintaining the staging path if present
//     const pathPrefix = isStaged ? 'staging/' : '';
//     const proxiedUrl = `${this.baseUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
    
//     return proxiedUrl;

//   } catch (e) {
//     console.error('Error converting Firebase URL:', e);
//     return url;
//   }
// }

// Helper method to check if a URL is for a staged image
isStagedImage(url: string): boolean {
  if (!url) return false;
  
  try {
    if (url.includes(this.baseUrl)) {
      // Check proxied URL
      return url.includes('/staging/');
    } else if (url.includes('firebasestorage.googleapis.com')) {
      // Check Firebase URL
      const urlObj = new URL(url);
      const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      return path.startsWith('staging/');
    }
  } catch (e) {
    console.error('Error checking staged image:', e);
  }
  return false;
}

// Helper method to get original path from Firebase URL
getOriginalPath(url: string): string {
  if (!url || !url.includes('firebasestorage.googleapis.com')) {
    return '';
  }

  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
  } catch (e) {
    console.error('Error getting original path:', e);
    return '';
  }
}

// Helper method to extract filename from URL
getFileName(url: string): string {
  try {
    const path = this.getOriginalPath(url);
    if (!path) return '';
    
    const segments = path.split('/');
    return segments[segments.length - 1];
  } catch (e) {
    console.error('Error getting filename:', e);
    return '';
  }
}
}

