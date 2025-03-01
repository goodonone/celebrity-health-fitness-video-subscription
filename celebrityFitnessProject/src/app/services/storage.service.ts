import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly baseUrl = environment.apiUrl;
  // private urlCache = new Map<string, string>();
  private urlCache = new Map<string, { url: string, timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private authService: AuthService) {
  }

private async getCachedUrl(key: string): Promise<string | null> {
  const cached = this.urlCache.get(key);
  if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    console.log('Using cached URL:', cached.url);
    return cached.url;
  }
  return null;
}

private setCachedUrl(key: string, url: string): void {
  this.urlCache.set(key, {
    url,
    timestamp: Date.now()
  });
}  

async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
  try {
    if (!fileName) return '';
    
    // Check if it's already a full URL
    if (fileName.startsWith('http')) {
      return fileName;
    }

    // Check cache first
    // const cacheKey = `${userId}-${fileName}-${isStaged}`;
    // const cached = this.urlCache.get(cacheKey);
    // if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    //   return cached.url;
    // }
    const cacheKey = `${userId}-${fileName}-${isStaged}`;
      const cachedUrl = await this.getCachedUrl(cacheKey);
      if (cachedUrl) return cachedUrl;

    const path = isStaged ? 
      `staging/profileImages/${userId}/${fileName}` :
      `profileImages/${userId}/${fileName}`;

    // Generate URL
    const url = `${this.baseUrl}/api/storage/${path}`;
    
    // Cache URL
    this.setCachedUrl(cacheKey, url);
    
    console.log('Generated URL:', url);
    return url;
  } catch (error) {
    console.error('Error generating URL:', error);
    throw error;
  }
}

// async getAuthHeaders(): Promise<{ [key: string]: string }> {
//   const token = await this.authService.waitForToken();
//   if (!token) {
//     throw new Error('No auth token available');
//   }
//   return {
//     'Authorization': `Bearer ${token}`
//   };
// }

async getAuthHeaders(): Promise<{ [key: string]: string }> {
  const token = await this.authService.waitForToken();
  if (!token) throw new Error('No auth token available');
  
  return {
    'Authorization': `Bearer ${token}`,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
}

// Latest working
// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Check cache first
//   const cachedUrl = await this.getCachedUrl(url);
//   if (cachedUrl) return cachedUrl;
  
//   try {
//     // If it's already a proxied URL, need to clean it up in case it's doubled
//     if (url.includes(`${this.baseUrl}/api/storage/`)) {
//       // Extract just the path part after /api/storage/
//       const path = url.split('/api/storage/').pop();
//       if (!path) return url;
      
//       // Ensure we don't have doubled URLs
//       if (path.includes(this.baseUrl)) {
//         const cleanPath = path.split(this.baseUrl).pop()?.split('/api/storage/').pop();
//         if (cleanPath) {
//           const cleanUrl = `${this.baseUrl}/api/storage/${cleanPath}`;
//           console.log('Cleaned doubled URL:', {
//             original: url,
//             cleaned: cleanUrl
//           });
//           this.setCachedUrl(url, cleanUrl);
//           return cleanUrl;
//         }
//       }
      
//       const cleanUrl = `${this.baseUrl}/api/storage/${path}`;
      
//       // Cache the cleaned URL
//       this.setCachedUrl(url, cleanUrl);
      
//       return cleanUrl;
//     }

//     let path: string;
//     let isStaged = false;
    
//     // Handle different URL formats
//     if (url.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(url);
//       path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       isStaged = path.includes('staging/');
//     } else if (!url.startsWith('http')) {
//       // Already a path - just clean it up
//       path = url.startsWith('/') ? url.substring(1) : url;
//       isStaged = path.includes('staging/');
//     } else {
//       // Already a converted URL or unknown format
//       return url;
//     }

//     // Keep staging prefix if present, don't strip it
//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    
//     // Cache the result
//     this.setCachedUrl(url, convertedUrl);
    
//     return convertedUrl;
//   } catch (error) {
//     console.error('Error converting URL:', error, {
//       originalUrl: url
//     });
//     throw error;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';

//   // Check cache first
//   const cachedUrl = await this.getCachedUrl(url);
//   if (cachedUrl) return cachedUrl;

//   try {
//     // Return early if already a valid URL format
//     if (url.startsWith('http') && !url.includes('firebasestorage.googleapis.com')) {
//       return url;
//     }

//     // Handle proxied URLs
//     if (url.includes(`${this.baseUrl}/api/storage/`)) {
//       const path = url.split('/api/storage/').pop();
//       if (!path) return url;

//       // Clean up doubled URLs
//       if (path.includes(this.baseUrl)) {
//         const cleanPath = path.split(this.baseUrl).pop()?.split('/api/storage/').pop();
//         if (cleanPath) {
//           const cleanUrl = `${this.baseUrl}/api/storage/${cleanPath}`;
//           await this.setCachedUrl(url, cleanUrl);
//           return cleanUrl;
//         }
//       }

//       const cleanUrl = `${this.baseUrl}/api/storage/${path}`;
//       await this.setCachedUrl(url, cleanUrl);
//       return cleanUrl;
//     }

//     // Extract path from Firebase URL or use direct path
//     let path: string;
//     if (url.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(url);
//       path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//     } else {
//       path = url.startsWith('/') ? url.substring(1) : url;
//     }

//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
//     await this.setCachedUrl(url, convertedUrl);
//     return convertedUrl;

//   } catch (error) {
//     console.error('Error converting URL:', error, { originalUrl: url });
//     throw error;
//   }
// }


async convertFirebaseUrl(url: string): Promise<string> {
  if (!url) return '';

  // Check cache first
  const cachedUrl = await this.getCachedUrl(url);
  if (cachedUrl) return cachedUrl;

  try {
    // Return early if already a valid URL format
    if (url.startsWith('http') && !url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    // Handle proxied URLs
    if (url.includes(`${this.baseUrl}/api/storage/`)) {
      const path = url.split('/api/storage/').pop();
      if (!path) return url;

      // Clean up doubled URLs
      if (path.includes(this.baseUrl)) {
        const cleanPath = path.split(this.baseUrl).pop()?.split('/api/storage/').pop();
        if (cleanPath) {
          const cleanUrl = `${this.baseUrl}/api/storage/${cleanPath}`;
          await this.setCachedUrl(url, cleanUrl);
          return cleanUrl;
        }
      }

      const cleanUrl = `${this.baseUrl}/api/storage/${path}`;
      await this.setCachedUrl(url, cleanUrl);
      return cleanUrl;
    }

    // Extract path from Firebase URL or use direct path
    let path: string;
    if (url.includes('firebasestorage.googleapis.com')) {
      const urlObj = new URL(url);
      path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    } else {
      path = url.startsWith('/') ? url.substring(1) : url;
    }

    // Add check to ensure path starts with profileImages/
    if (!path.startsWith('profileImages/') && !path.startsWith('staging/')) {
      path = `profileImages/${path}`;
    }

    const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    await this.setCachedUrl(url, convertedUrl);
    return convertedUrl;

  } catch (error) {
    console.error('Error converting URL:', error, { originalUrl: url });
    throw error;
  }
}

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

private extractPath(url: string): string {
  if (!url) return '';

  try {
    if (url.startsWith('profileImages/')) {
      return url;
    }

    if (url.includes('/api/storage/')) {
      return url.split('/api/storage/')[1];
    }

    if (url.includes('firebasestorage.googleapis.com')) {
      const urlObj = new URL(url);
      return decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    }

    return url;
  } catch (error) {
    console.error('Error extracting path:', error);
    return url;
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

clearUrlCache() {
  this.urlCache.clear();
}

// clearStagedUrlCache(userId: string) {
//   for (const [key] of this.urlCache) {
//     if (key.startsWith('staged:') && key.includes(userId)) {
//       this.urlCache.delete(key);
//     }
//   }
// }

clearStagedUrlCache(userId: string): void {
  // Clear all cached URLs related to staged files for this user
  const stagedPrefix = `staging/profileImages/${userId}`;
  for (const [key] of this.urlCache.entries()) {
    if (key.includes(stagedPrefix)) {
      this.urlCache.delete(key);
    }
  }
}

clearUserUrlCache(userId: string) {
  for (const [key] of this.urlCache) {
    if (key.includes(userId)) {
      this.urlCache.delete(key);
    }
  }
}

// Helper to clean expired cache entries
// private cleanCache() {
//   const now = Date.now();
//   for (const [key, value] of this.urlCache.entries()) {
//     if (now - value.timestamp > this.CACHE_DURATION) {
//       this.urlCache.delete(key);
//     }
//   }
// }

private cleanCache(): void {
  const now = Date.now();
  for (const [key, data] of this.urlCache.entries()) {
    if (now - data.timestamp > this.CACHE_DURATION) {
      this.urlCache.delete(key);
    }
    }
}

async getProxiedUrl(path: string, isStaged: boolean = false): Promise<string> {
  try {
    // Generate cache key that includes staging status
    const cacheKey = `${isStaged ? 'staged:' : ''}${path}`;
    
    // Check cache first
    const cached = this.urlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.url;
    }

    // Clean the path and ensure proper formatting
    const cleanPath = path.replace(/^\/+/, '');
    
    // Handle staging prefix properly
    let fullPath = cleanPath;
    if (isStaged && !cleanPath.startsWith('staging/')) {
      fullPath = `staging/${cleanPath}`;
    } else if (!isStaged && cleanPath.startsWith('staging/')) {
      fullPath = cleanPath.replace('staging/', '');
    }

    // Generate proxied URL
    const proxiedUrl = `${this.baseUrl}/api/storage/${fullPath}`;
    
    // Cache the result
    this.urlCache.set(cacheKey, {
      url: proxiedUrl,
      timestamp: Date.now()
    });
    
    return proxiedUrl;
  } catch (error) {
    console.error('Error generating proxied URL:', error);
    throw error;
  }
}  

// In StorageService
invalidateUrlCache(userId: string | null = null): void {
  if (userId) {
    // Clear specific user's cached URLs
    Array.from(this.urlCache.keys())
      .filter(key => key.includes(userId))
      .forEach(key => this.urlCache.delete(key));
  } else {
    // Clear all cached URLs
    this.urlCache.clear();
  }
}


}

