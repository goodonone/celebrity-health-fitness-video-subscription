// src/app/services/storage.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private authService: AuthService) {
  }

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


// convertFirebaseUrl(url: string): string {
//   if (!url) return '';
  
//   // Skip conversion if not a Firebase Storage URL
//   if (!url.includes('firebasestorage.googleapis.com')) {
//     return url;
//   }
  
//   // Check if it's already a proxied URL
//   if (url.includes(this.baseUrl)) {
//     return url;
//   }

//   try {
//     // Parse the URL to extract components
//     const urlObj = new URL(url);
    
//     // Check if we have the expected path structure
//     if (!urlObj.pathname.includes('/o/')) {
//       console.log('Not a Firebase Storage URL structure');
//       return url;
//     }

//     const fullPath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    
//     // Check if this is a staged image
//     const isStaged = fullPath.startsWith('staging/');

//     // Extract path components
//     const pathSegments = fullPath.split('/');
//     let userId, fileName;
    
//     if (isStaged) {
//       // For staged images: staging/profileImages/userId/fileName
//       userId = pathSegments[2];
//       fileName = pathSegments[3];
//     } else {
//       // For permanent images: profileImages/userId/fileName
//       userId = pathSegments[1];
//       fileName = pathSegments[2];
//     }
    
//     if (!userId || !fileName) {
//       return url;
//     }

//     // Construct the proxied URL maintaining the staging path if present
//     const pathPrefix = isStaged ? 'staging/' : '';
//     const proxiedUrl = `${this.baseUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
    
//     return proxiedUrl;

//   } catch (e) {
//     console.error('Error converting Firebase URL:', e);
//     return url;
//   }
// }

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

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Skip conversion if not a Firebase Storage URL
//   if (!url.includes('firebasestorage.googleapis.com')) {
//     return url;
//   }
  
//   // Check if it's already a proxied URL
//   if (url.includes(this.baseUrl)) {
//     // If already proxied, ensure it has auth token
//     return this.addAuthToUrl(url);
//   }

//   try {
//     // Parse the URL to extract components
//     const urlObj = new URL(url);
    
//     // Check if we have the expected path structure
//     if (!urlObj.pathname.includes('/o/')) {
//       console.log('Not a Firebase Storage URL structure');
//       return url;
//     }

//     const fullPath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    
//     // Check if this is a staged image
//     const isStaged = fullPath.startsWith('staging/');

//     // Extract path components
//     const pathSegments = fullPath.split('/');
//     let userId, fileName;
    
//     if (isStaged) {
//       // For staged images: staging/profileImages/userId/fileName
//       userId = pathSegments[2];
//       fileName = pathSegments[3];
//     } else {
//       // For permanent images: profileImages/userId/fileName
//       userId = pathSegments[1];
//       fileName = pathSegments[2];
//     }
    
//     if (!userId || !fileName) {
//       return url;
//     }

//     // Construct the proxied URL maintaining the staging path if present
//     const pathPrefix = isStaged ? 'staging/' : '';
//     const proxiedUrl = `${this.baseUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
    
//     // Add auth token to URL
//     return this.addAuthToUrl(proxiedUrl);

//   } catch (e) {
//     console.error('Error converting Firebase URL:', e);
//     return url;
//   }
// }

// private async addAuthToUrl(url: string): Promise<string> {
//   try {
//     const token = await this.authService.getToken();
//     if (!token) {
//       console.warn('No auth token available for URL conversion');
//       return url;
//     }

//     // Parse existing URL
//     const urlObj = new URL(url);
    
//     // Remove any existing token
//     urlObj.searchParams.delete('token');
    
//     // Add new token
//     urlObj.searchParams.set('token', token);
    
//     return urlObj.toString();
//   } catch (error) {
//     console.error('Error adding auth to URL:', error);
//     return url;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Skip conversion if not a Firebase Storage URL
//   if (!url.includes('firebasestorage.googleapis.com')) {
//     return url;
//   }
  
//   // Check if it's already a proxied URL
//   if (url.includes(this.baseUrl)) {
//     return this.addAuthToUrl(url);
//   }

//   try {
//     // Parse the URL to extract components
//     const urlObj = new URL(url);
    
//     // Check if we have the expected path structure
//     if (!urlObj.pathname.includes('/o/')) {
//       console.log('Not a Firebase Storage URL structure');
//       return url;
//     }

//     const fullPath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    
//     // Check if this is a staged image
//     const isStaged = fullPath.startsWith('staging/');

//     // Extract path components
//     const pathSegments = fullPath.split('/');
//     let userId, fileName;
    
//     if (isStaged) {
//       // For staged images: staging/profileImages/userId/fileName
//       userId = pathSegments[2];
//       fileName = pathSegments[3];
//     } else {
//       // For permanent images: profileImages/userId/fileName
//       userId = pathSegments[1];
//       fileName = pathSegments[2];
//     }
    
//     if (!userId || !fileName) {
//       return url;
//     }

//     // Construct the proxied URL maintaining the staging path if present
//     const pathPrefix = isStaged ? 'staging/' : '';
//     const proxiedUrl = `${this.baseUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
    
//     // Add auth token
//     return this.addAuthToUrl(proxiedUrl);

//   } catch (e) {
//     console.error('Error converting Firebase URL:', e);
//     return url;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   if (!url.includes('firebasestorage.googleapis.com')) {
//     return url;
//   }

//   try {
//     // Get the base proxied URL
//     const proxiedUrl = await this.getProxiedUrl(url);
    
//     // Add auth token
//     const token = await this.authService.getToken();
//     if (!token) {
//       console.warn('No auth token available for URL conversion');
//       return proxiedUrl;
//     }

//     // Create URL object to handle parameters properly
//     // const urlObj = new URL(proxiedUrl);
//     // urlObj.searchParams.set('token', token);
    
//     // return urlObj.toString();
//     return proxiedUrl;
//   } catch (error) {
//     console.error('Error converting Firebase URL:', error);
//     return url;
//   }
// }

// // storage.service.ts
// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   if (!url.includes('firebasestorage.googleapis.com')) {
//     return url;
//   }

//   try {
//     // Get the base proxied URL
//     const proxiedUrl = await this.getProxiedUrl(url);
    
//     // Add auth token to headers instead of URL
//     const token = await this.authService.getToken();
//     if (!token) {
//       console.warn('No auth token available for URL conversion');
//       return proxiedUrl;
//     }

//     return proxiedUrl;
//   } catch (error) {
//     console.error('Error converting Firebase URL:', error);
//     return url;
//   }
// }

// storage.service.ts
async convertFirebaseUrl(url: string): Promise<string> {
  if (!url) return '';
  
  if (!url.includes('firebasestorage.googleapis.com')) {
    return url;
  }

  try {
    const proxiedUrl = await this.getProxiedUrl(url);
    const token = await this.authService.getToken();
    
    // For staged images, add auth token
    if (proxiedUrl.includes('/staging/')) {
      const urlObj = new URL(proxiedUrl);
      urlObj.searchParams.set('token', token || '');
      return urlObj.toString();
    }

    return proxiedUrl;
  } catch (error) {
    console.error('Error converting Firebase URL:', error);
    return url;
  }
}

private getProxiedUrl(firebaseUrl: string): string {
  const urlObj = new URL(firebaseUrl);
  const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
  const isStaged = path.startsWith('staging/');
  const segments = path.split('/');
  
  // Extract userId and fileName based on path structure
  const userId = isStaged ? segments[2] : segments[1];
  const fileName = segments[segments.length - 1];

  // Generate URL matching backend routes
  return isStaged 
    ? `${environment.apiUrl}/api/storage/staging/profileImages/${userId}/${fileName}`
    : `${environment.apiUrl}/api/storage/profileImages/${userId}/${fileName}`;
}

// private async getProxiedUrl(firebaseUrl: string): Promise<string> {
//   try {
//     const urlObj = new URL(firebaseUrl);
//     if (!urlObj.pathname.includes('/o/')) {
//       return firebaseUrl;
//     }

//     const fullPath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//     const isStaged = fullPath.startsWith('staging/');
//     const pathSegments = fullPath.split('/');
    
//     let userId, fileName;
//     if (isStaged) {
//       userId = pathSegments[2];
//       fileName = pathSegments[3];
//     } else {
//       userId = pathSegments[1];
//       fileName = pathSegments[2];
//     }

//     if (!userId || !fileName) {
//       return firebaseUrl;
//     }

//     const pathPrefix = isStaged ? 'staging/' : '';
//     return `${environment.apiUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
//   } catch (error) {
//     console.error('Error creating proxied URL:', error);
//     return firebaseUrl;
//   }
// }

private async addAuthToUrl(url: string): Promise<string> {
  try {
    const token = await this.authService.getToken();
    if (!token) {
      console.warn('No auth token available for URL conversion');
      return url;
    }

    const urlObj = new URL(url);
    
    // Remove any existing token
    urlObj.searchParams.delete('token');
    
    // Add new token
    urlObj.searchParams.set('token', token);
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error adding auth to URL:', error);
    return url;
  }
}


private isFirebaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('firebasestorage.googleapis.com') && 
           urlObj.pathname.includes('/o/');
  } catch {
    return false;
  }
}

private isProxiedUrl(url: string): boolean {
  return url.includes(this.baseUrl);
}

private getCleanPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

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


