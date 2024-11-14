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

// async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
//   try {
//     // If a full URL is passed, extract the path
//     let path: string;
//     if (fileName.startsWith('http')) {
//       const url = new URL(fileName);
//       path = url.pathname.replace('/api/storage/', '');
//     } else if (fileName.includes('/')) {
//       // If it's already a path, use it directly
//       path = fileName;
//     } else {
//       // If it's just a filename, construct the full path
//       path = `${isStaged ? 'staging/' : ''}profileImages/${userId}/${fileName}`;
//     }

//     // Ensure the path is properly formatted
//     path = path.replace(/^\/+/, '');

//     // Return base URL without token or timestamp
//     const url = `${this.baseUrl}/api/storage/${path}`;
//     console.log('Generated URL:', url);
    
//     return url;
//   } catch (error) {
//     console.error('Error generating image URL:', error);
//     throw error;
//   }
// }

// async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
//   try {
//     // Check cache first
//     const cacheKey = `${userId}-${fileName}-${isStaged}`;
//     if (this.urlCache.has(cacheKey)) {
//       return this.urlCache.get(cacheKey)!;
//     }

//     const path = isStaged ? 
//       `staging/profileImages/${userId}/${fileName}` :
//       `profileImages/${userId}/${fileName}`;

//     // Generate URL
//     const url = `${this.baseUrl}/api/storage/${path}`;
    
//     // Cache URL
//     this.urlCache.set(cacheKey, url);
    
//     console.log('Generated URL:', url);
//     return url;
//   } catch (error) {
//     console.error('Error generating URL:', error);
//     throw error;
//   }
// }

async generateImageUrl(userId: string, fileName: string, isStaged = false): Promise<string> {
  try {
    // Check cache first
    const cacheKey = `${userId}-${fileName}-${isStaged}`;
    const cached = this.urlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.url;
    }

    const path = isStaged ? 
      `staging/profileImages/${userId}/${fileName}` :
      `profileImages/${userId}/${fileName}`;

    // Generate URL
    const url = `${this.baseUrl}/api/storage/${path}`;
    
    // Cache URL
    this.urlCache.set(cacheKey, {
      url,
      timestamp: Date.now()
    });
    
    console.log('Generated URL:', url);
    return url;
  } catch (error) {
    console.error('Error generating URL:', error);
    throw error;
  }
}

async getAuthHeaders(): Promise<{ [key: string]: string }> {
  const token = await this.authService.waitForToken();
  if (!token) {
    throw new Error('No auth token available');
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}

// Add this method to get auth headers
// getAuthHeaders(): { [key: string]: string } {
//   const token = this.authService.getToken();
//   if (!token) {
//     throw new Error('No auth token available');
//   }
//   return {
//     'Authorization': `Bearer ${token}`
//   };
// }
// storage.service.ts
// async getAuthHeaders(): Promise<{ [key: string]: string }> {
//   try {
//     const token = await this.authService.getToken();
//     if (!token) {
//       throw new Error('No auth token available');
//     }
//     return {
//       'Authorization': `Bearer ${token}`
//     };
//   } catch (error) {
//     console.error('Error getting auth headers:', error);
//     throw error;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   try {
//     let path: string;
//     if (url.includes('firebasestorage.googleapis.com')) {
//       // Extract path from Firebase URL
//       const urlObj = new URL(url);
//       path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       console.log('Extracted path from Firebase URL:', path);
//     } else if (!url.startsWith('http')) {
//       // Treat as relative path
//       path = url.startsWith('/') ? url.substring(1) : url;
//       console.log('Using relative path:', path);
//     } else {
//       console.log('Using direct URL:', url);
//       return url; // Return as-is if it's already a valid HTTP URL
//     }

//     // Return URL without token
//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
//     console.log('Converted URL:', convertedUrl);
    
//     return convertedUrl;

//   } catch (error) {
//     console.error('Error converting Firebase URL:', {
//       originalUrl: url,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//     return url;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Check cache first
//   const cached = this.urlCache.get(url);
//   if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
//     return cached.url;
//   }
  
//   try {
//     let path: string;
//     if (url.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(url);
//       path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//     } else if (!url.startsWith('http')) {
//       path = url.startsWith('/') ? url.substring(1) : url;
//     } else {
//       return url;
//     }

//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    
//     // Cache the result
//     this.urlCache.set(url, { 
//       url: convertedUrl, 
//       timestamp: Date.now() 
//     });
    
//     return convertedUrl;
//   } catch (error) {
//     console.error('Error converting Firebase URL:', error);
//     return url;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Check cache first
//   const cached = this.urlCache.get(url);
//   if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
//     return cached.url;
//   }
  
//   try {
//     let path: string;
//     if (url.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(url);
//       path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       console.log('Extracted path from Firebase URL:', path);
//     } else if (!url.startsWith('http')) {
//       path = url.startsWith('/') ? url.substring(1) : url;
//       console.log('Using relative path:', path);
//     } else {
//       console.log('Using direct URL:', url);
//       return url;
//     }

//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    
//     // Cache the result
//     this.urlCache.set(url, {
//       url: convertedUrl,
//       timestamp: Date.now()
//     });
    
//     console.log('Converted URL:', convertedUrl);
//     return convertedUrl;

//   } catch (error) {
//     console.error('Error converting Firebase URL:', error);
//     return url;
//   }
// }

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Check cache first
//   const cached = this.urlCache.get(url);
//   if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
//     return cached.url;
//   }
  
//   try {
//     let path: string;
    
//     // Handle different URL formats
//     if (url.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(url);
//       path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//     } else if (!url.startsWith('http')) {
//       // Already a path - just clean it up
//       path = url.startsWith('/') ? url.substring(1) : url;
//     } else {
//       // Already a converted URL
//       return url;
//     }

//     // Generate proxied URL
//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    
//     // Cache the result
//     this.urlCache.set(url, {
//       url: convertedUrl,
//       timestamp: Date.now()
//     });
    
//     return convertedUrl;
//   } catch (error) {
//     console.error('Error converting URL:', error);
//     throw error;
//   }
// }

// In storage.service.ts

// async convertFirebaseUrl(url: string): Promise<string> {
//   if (!url) return '';
  
//   // Check cache first
//   const cached = this.urlCache.get(url);
//   if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
//     console.log('Using cached URL:', cached.url);
//     return cached.url;
//   }
  
//   try {
//     // If it's already a proxied URL, just return it
//     if (url.includes(`${this.baseUrl}/api/storage/`)) {
//       return url;
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
//     // This is key for immediate visibility of staged images
//     const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    
//     console.log('Converting URL:', {
//       original: url,
//       path: path,
//       isStaged: isStaged,
//       converted: convertedUrl
//     });
    
//     // Cache the result
//     this.urlCache.set(url, {
//       url: convertedUrl,
//       timestamp: Date.now()
//     });
    
//     return convertedUrl;
//   } catch (error) {
//     console.error('Error converting URL:', error, {
//       originalUrl: url
//     });
//     throw error;
//   }
// }

async convertFirebaseUrl(url: string): Promise<string> {
  if (!url) return '';
  
  // Check cache first
  const cached = this.urlCache.get(url);
  if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    console.log('Using cached URL:', cached.url);
    return cached.url;
  }
  
  try {
    // If it's already a proxied URL, need to clean it up in case it's doubled
    if (url.includes(`${this.baseUrl}/api/storage/`)) {
      // Extract just the path part after /api/storage/
      const path = url.split('/api/storage/').pop();
      if (!path) return url;
      
      // Ensure we don't have doubled URLs
      if (path.includes(this.baseUrl)) {
        const cleanPath = path.split(this.baseUrl).pop()?.split('/api/storage/').pop();
        if (cleanPath) {
          const cleanUrl = `${this.baseUrl}/api/storage/${cleanPath}`;
          console.log('Cleaned doubled URL:', {
            original: url,
            cleaned: cleanUrl
          });
          return cleanUrl;
        }
      }
      
      const cleanUrl = `${this.baseUrl}/api/storage/${path}`;
      
      // Cache the cleaned URL
      this.urlCache.set(url, {
        url: cleanUrl,
        timestamp: Date.now()
      });
      
      return cleanUrl;
    }

    let path: string;
    let isStaged = false;
    
    // Handle different URL formats
    if (url.includes('firebasestorage.googleapis.com')) {
      const urlObj = new URL(url);
      path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      isStaged = path.includes('staging/');
    } else if (!url.startsWith('http')) {
      // Already a path - just clean it up
      path = url.startsWith('/') ? url.substring(1) : url;
      isStaged = path.includes('staging/');
    } else {
      // Already a converted URL or unknown format
      return url;
    }

    // Keep staging prefix if present, don't strip it
    const convertedUrl = `${this.baseUrl}/api/storage/${path}`;
    
    console.log('Converting URL:', {
      original: url,
      path: path,
      isStaged: isStaged,
      converted: convertedUrl
    });
    
    // Cache the result
    this.urlCache.set(url, {
      url: convertedUrl,
      timestamp: Date.now()
    });
    
    return convertedUrl;
  } catch (error) {
    console.error('Error converting URL:', error, {
      originalUrl: url
    });
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

clearStagedUrlCache(userId: string) {
  for (const [key] of this.urlCache) {
    if (key.startsWith('staged:') && key.includes(userId)) {
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
private cleanCache() {
  const now = Date.now();
  for (const [key, value] of this.urlCache.entries()) {
    if (now - value.timestamp > this.CACHE_DURATION) {
      this.urlCache.delete(key);
    }
  }
}

  // async getProxiedUrl(firebaseUrl: string): Promise<string> {
  //   // Check cache first
  //   if (this.urlCache.has(firebaseUrl)) {
  //     return this.urlCache.get(firebaseUrl)!;
  //   }

  //   // Generate new proxied URL
  //   const proxiedUrl = await this.convertFirebaseUrl(firebaseUrl);
    
  //   // Cache the result
  //   this.urlCache.set(firebaseUrl, proxiedUrl);
    
  //   return proxiedUrl;
  // }

  // async getProxiedUrl(firebaseUrl: string): Promise<string> {
  //   // Check cache first
  //   const cached = this.urlCache.get(firebaseUrl);
  //   if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
  //     return cached.url;
  //   }

  //   // Generate new proxied URL
  //   const proxiedUrl = await this.convertFirebaseUrl(firebaseUrl);
    
  //   // Cache the result
  //   this.urlCache.set(firebaseUrl, {
  //     url: proxiedUrl,
  //     timestamp: Date.now()
  //   });
    
  //   return proxiedUrl;
  // }

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

}


