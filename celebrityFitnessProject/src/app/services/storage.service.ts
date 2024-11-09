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

// async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
//   const token = await this.authService.getToken();
//   const pathPrefix = isStaged ? 'staging/' : '';
//   const path = `${pathPrefix}profileImages/${userId}/${fileName}`.replace(/^\/+/, '');
//   const timestamp = Date.now();
//   return `${environment.apiUrl}/api/storage/${path}?token=${token}&t=${timestamp}`;
// }

// async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
//   try {
//     const token = await this.authService.getToken();
//     if (!token) {
//       throw new Error('No auth token available');
//     }

//     // If a full URL is passed, extract the path
//     let path: string;
//     if (fileName.startsWith('http')) {
//       const url = new URL(fileName);
//       path = url.pathname.replace('/api/storage/', '');
//     } else {
//       path = fileName.startsWith('/') ? fileName.substring(1) : fileName;
//     }

//     // Add staging prefix if needed
//     if (isStaged) {
//       path = `staging/${path}`;
//     }

//     // Ensure the path is properly formatted
//     path = path.replace(/^\/+/, '');

//     // Generate the full URL with token and timestamp
//     const url = `${this.baseUrl}/api/storage/${path}?token=${token}&t=${Date.now()}`;
//     console.log('Generated image URL:', url);
//     return url;
//   } catch (error) {
//     console.error('Error generating image URL:', error);
//     throw error;
//   }
// }

async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
  try {
    const token = await this.authService.getToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    // If a full URL is passed, extract the path
    let path: string;
    if (fileName.startsWith('http')) {
      const url = new URL(fileName);
      path = url.pathname.replace('/api/storage/', '');
    } else if (fileName.includes('/')) {
      // If it's already a path, use it directly
      path = fileName;
    } else {
      // If it's just a filename, construct the full path
      path = `${isStaged ? 'staging/' : ''}profileImages/${userId}/${fileName}`;
    }

    // Ensure the path is properly formatted
    path = path.replace(/^\/+/, '');

    console.log('Generating URL for path:', path);
    const url = `${this.baseUrl}/api/storage/${path}?token=${token}&t=${Date.now()}`;
    console.log('Generated URL:', url);
    
    return url;
  } catch (error) {
    console.error('Error generating image URL:', error);
    throw error;
  }
}


// async getBackgroundImageUrl(url: string): Promise<string> {
//   if (!url) return '';
//   try {
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return this.convertFirebaseUrl(url);
//     }
//     // If it's already a path or URL, just ensure it's properly formatted
//     return this.generateImageUrl(
//       this.userId, 
//       url,
//       false
//     );
//   } catch (error) {
//     console.error('Error getting background image URL:', error);
//     return '';
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
//     const urlObj = new URL(proxiedUrl);
//     urlObj.searchParams.set('token', token);
    
//     return urlObj.toString();
//   } catch (error) {
//     console.error('Error converting Firebase URL:', error);
//     return url;
//   }
// }
async convertFirebaseUrl(url: string): Promise<string> {
  if (!url) return '';
  
  try {
    const token = await this.authService.getToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    let path: string;
    if (url.includes('firebasestorage.googleapis.com')) {
      // Extract path from Firebase URL
      const urlObj = new URL(url);
      path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      console.log('Extracted path from Firebase URL:', path);
    } else if (!url.startsWith('http')) {
      // Treat as relative path
      path = url.startsWith('/') ? url.substring(1) : url;
      console.log('Using relative path:', path);
    } else {
      console.log('Using direct URL:', url);
      return url; // Return as-is if it's already a valid HTTP URL
    }

    const convertedUrl = `${this.baseUrl}/api/storage/${path}?token=${token}&t=${Date.now()}`;
    console.log('Converted URL:', convertedUrl);
    
    return convertedUrl;

  } catch (error) {
    console.error('Error converting Firebase URL:', {
      originalUrl: url,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return url;
  }
}

private getProxiedUrl(firebaseUrl: string): string {
  try {
    const urlObj = new URL(firebaseUrl);
    const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    const isStaged = path.startsWith('staging/');
    const segments = path.split('/');
    
    let userId, fileName;
    if (isStaged) {
      userId = segments[2];
      fileName = segments[3];
    } else {
      userId = segments[1];
      fileName = segments[2];
    }

    // Generate URL matching backend routes
  //   const pathPrefix = isStaged ? 'staging/' : '';
  //   return `${environment.apiUrl}/api/storage/${pathPrefix}profileImages/${userId}/${fileName}`;
  // } catch (error) {
  //   console.error('Error creating proxied URL:', error);
  //   return firebaseUrl;
  // }
  const pathPrefix = isStaged ? '/storage/staging/' : '/storage/';
  return `${this.baseUrl}${pathPrefix}profileImages/${userId}/${fileName}`;
} catch (error) {
  console.error('Error creating proxied URL:', error);
  return firebaseUrl;
}
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
  return url.includes(`${this.baseUrl}/storage/`);
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
      return url.includes('/storage/staging/');
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


