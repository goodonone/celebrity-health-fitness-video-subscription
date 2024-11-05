

//   async getDisplayUrl(userId: string, imageUrl: string | null): Promise<string> {
//     if (!imageUrl) return '';

//     // Handle external URLs (like Unsplash)
//     if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('/api/storage/')) {
//       return imageUrl;
//     }

//     // For Firebase URLs, convert to proxied URL
//     if (imageUrl.includes('firebasestorage.googleapis.com')) {
//       return this.storageService.convertFirebaseUrl(imageUrl);
//     }

//     // Already a proxied URL
//     return imageUrl;
//   }

//   async handleImageUpload(file: File, userId: string): Promise<string> {
//     try {
//       // Upload to staged location
//       const firebaseUrl = await this.firebaseService.uploadFile(file, userId, 'profileImages', true);
      
//       // Convert to proxied URL
//       return this.storageService.convertFirebaseUrl(firebaseUrl);
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//     try {
//       // Upload and get Firebase URL
//       const firebaseUrl = await this.firebaseService.uploadFile(file, userId, 'profileImages', true);
      
//       // Convert to proxied URL for display
//       const proxiedUrl = this.storageService.convertFirebaseUrl(firebaseUrl);
//       return proxiedUrl;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//     try {
//       // Clean up any existing staged file
//       if (this.stagedUrl) {
//         await this.firebaseService.cleanupStagedFile(userId);
//         this.stagedUrl = null;
//       }

//       // Upload and get Firebase URL
//       const firebaseUrl = await this.firebaseService.uploadFile(file, userId, 'profileImages', true);
      
//       // Store the staged URL
//       this.stagedUrl = firebaseUrl;
      
//       // Convert to proxied URL for display
//       return this.storageService.convertFirebaseUrl(firebaseUrl);
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }


//   async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       // For external URLs (like Unsplash), return as is
//       if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('/api/storage/')) {
//         return imageUrl;
//       }

//       // For staged images
//       if (imageUrl.includes('/staging/')) {
//         // Get the filename from the URL
//         const fileName = this.storageService.getFileName(imageUrl);
        
//         // Move to permanent storage and get Firebase URL
//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, fileName);
//         return permanentUrl;
//       }

//       // If it's already a Firebase URL, return it
//       if (imageUrl.includes('firebasestorage.googleapis.com')) {
//         return imageUrl;
//       }

//       // For proxied URLs, get the original Firebase URL
//       if (imageUrl.includes('/api/storage/')) {
//         // Convert back to Firebase URL if needed
//         // You might need to implement this conversion
//         return imageUrl;
//       }

//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }

// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       // For external URLs, return as is
//       if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('/api/storage/')) {
//         return imageUrl;
//       }

//       // For staged files
//       if (this.stagedUrl && imageUrl.includes('/staging/')) {
//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, );
//         this.stagedUrl = null;
//         return permanentUrl;
//       }

//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }


//   async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       // For external URLs, just return as is
//       if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('/api/storage/')) {
//         return imageUrl;
//       }

//       // For staged images, move to permanent storage
//       if (imageUrl.includes('/staging/')) {
//         const fileName = this.storageService.getFileName(imageUrl);
//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, fileName);
//         return this.storageService.convertFirebaseUrl(permanentUrl);
//       }

//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }

// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       console.log('Saving profile image:', { imageUrl });
  
//       // For external URLs (like Unsplash), just return as is
//       if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('/api/storage/')) {
//         return imageUrl;
//       }
  
//       // For staged images
//       if (imageUrl.includes('/staging/')) {
//         const fileName = this.storageService.getFileName(imageUrl);
//         console.log('Moving staged file to permanent storage:', { fileName });
        
//         // Move to permanent storage
//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, fileName);
//         console.log('Got permanent URL:', { permanentUrl });
        
//         // Return the Firebase URL directly (not the proxied URL)
//         return permanentUrl;
//       }
  
//       // For already permanent Firebase URLs
//       if (imageUrl.includes('firebasestorage.googleapis.com')) {
//         return imageUrl;
//       }
  
//       // For proxied permanent URLs, convert back to Firebase URL
//       if (imageUrl.includes('/api/storage/')) {
//         // TODO: Implement conversion from proxied to Firebase URL if needed
//         return imageUrl;
//       }
  
//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }


// This is the original code

import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageUrlManagerService {
    private stagedUrl: string | null = null;
    private stagedFileName: string | null = null;
    private readonly baseUrl = environment.apiUrl;

  constructor(
    private storageService: StorageService,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

// async handleImageUpload(file: File, userId: string): Promise<string> {
//     try {
//       // Clean up any existing staged file
//       if (this.stagedUrl) {
//         await this.firebaseService.cleanupStagedFile(userId);
//         this.stagedUrl = null;
//         this.stagedFileName = null;
//       }

//       // Upload and get Firebase URL
//       const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
//       console.log('Firebase url:', firebaseUrl );

//       // Store the staged URL and filename
//       this.stagedUrl = firebaseUrl;
//       this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
      
//       // Convert to proxied URL for display
//       return this.storageService.convertFirebaseUrl(firebaseUrl);
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Upload to Firebase and get URL
//     const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
    
//     // Convert to proxied URL for display
//     const displayUrl = this.storageService.convertFirebaseUrl(firebaseUrl);
    
//     // Store the staging info
//     this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
//     this.stagedUrl = firebaseUrl;

//     return displayUrl;
//   } catch (error) {
//     console.error('Error handling image upload:', error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Upload to Firebase
//     const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
    
//     // Store staging info
//     this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
//     this.stagedUrl = firebaseUrl;
    
//     // Return proxied URL for display
//     return this.storageService.convertFirebaseUrl(firebaseUrl);
//   } catch (error) {
//     console.error('Error handling image upload:', error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Upload to Firebase
//     const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
    
//     // Store staging info
//     this.stagedUrl = firebaseUrl;
//     this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
    
//     // Convert to proxied URL and add auth token
//     const displayUrl = this.storageService.convertFirebaseUrl(firebaseUrl);
//     const token = this.authService.getToken();
//     return `${displayUrl}?token=${token}`;
//   } catch (error) {
//     console.error('Error handling image upload:', error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Upload to Firebase
//     const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
    
//     // Store staging info
//     this.stagedUrl = firebaseUrl;
//     this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
    
//     // Convert to proxied URL and add auth token
//     const displayUrl = await this.storageService.convertFirebaseUrl(firebaseUrl);
//     const token = await this.authService.getToken();
    
//     if (!token) {
//       console.warn('No auth token available');
//       return displayUrl;
//     }

//     // Return URL with token
//     return `${displayUrl}?token=${token}`;
//   } catch (error) {
//     console.error('Error handling image upload:', error);
//     throw error;
//   }
// }

async handleImageUpload(file: File, userId: string): Promise<string> {
  console.log('Starting image upload process...', { userId });
  try {
    const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
    console.log('Firebase upload complete:', { firebaseUrl });
    
    this.stagedUrl = firebaseUrl;
    this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
    console.log('Staging info set:', { 
      stagedUrl: this.stagedUrl,
      stagedFileName: this.stagedFileName 
    });
    
    const displayUrl = await this.storageService.convertFirebaseUrl(firebaseUrl);
    console.log('Converted to proxied URL:', { displayUrl });
    
    const token = await this.authService.getToken();
    console.log('Got auth token:', { hasToken: !!token });

    const finalUrl = `${displayUrl}?token=${token}`;
    console.log('Final URL generated:', { 
      finalUrl: finalUrl.substring(0, 50) + '...' 
    });
    
    return finalUrl;
  } catch (error) {
    console.error('Error in handleImageUpload:', error);
    throw error;
  }
}


// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       // For external URLs, return as is
//       if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('/api/storage/')) {
//         return imageUrl;
//       }

//       // For staged files
//       if (this.stagedUrl && imageUrl.includes('/staging/')) {
//         if (!this.stagedFileName) {
//           throw new Error('No staged filename found');
//         }
        
//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, this.stagedFileName);
//         this.stagedUrl = null;
//         this.stagedFileName = null;
//         return permanentUrl;
//       }

//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }

// image-url-manager.service.ts

// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       // For external URLs, return as is
//       if (!this.isFirebaseUrl(imageUrl) && !this.isProxiedUrl(imageUrl)) {
//         return imageUrl;
//       }
  
//       // For staged files
//       if (this.stagedUrl && this.isStagedUrl(imageUrl)) {
//         if (!this.stagedFileName) {
//           throw new Error('No staged filename found');
//         }
  
//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, this.stagedFileName);
//         this.clearStagedFile();
//         return permanentUrl;
//       }
  
//       // If image is already in permanent storage, return as is
//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }

// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//   if (!this.isFirebaseUrl(imageUrl) && !this.isProxiedUrl(imageUrl)) {
//     return imageUrl;
//   }

//   try {
//     // If we have a staged file, move it to permanent storage
//     if (this.stagedUrl && this.stagedFileName) {
//       const permanentUrl = await this.firebaseService.moveToPermStorage(
//         userId,
//         this.stagedFileName
//       );
//       this.clearStagedFile();
//       return permanentUrl;
//     }

//     return imageUrl;
//   } catch (error) {
//     console.error('Error saving profile image:', error);
//     throw error;
//   }
// }

// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//   if (!this.isFirebaseUrl(imageUrl) && !this.isProxiedUrl(imageUrl)) {
//     return imageUrl;
//   }

//   try {
//     if (this.stagedUrl && this.stagedFileName) {
//       const permanentUrl = await this.firebaseService.moveToPermStorage(
//         userId,
//         this.stagedFileName
//       );
//       this.clearStagedFile();
//       return permanentUrl;
//     }
//     return imageUrl;
//   } catch (error) {
//     console.error('Error saving profile image:', error);
//     throw error;
//   }
// }

// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//   try {
//     if (!this.stagedFileName) {
//       console.log('No staged file to move');
//       return imageUrl;
//     }

//     const permanentUrl = await this.firebaseService.moveToPermStorage(
//       userId,
//       this.stagedFileName
//     );

//     this.clearStagedFile();
//     return permanentUrl;
//   } catch (error) {
//     console.error('Error saving profile image:', error);
//     throw error;
//   }
// }

// // imageurlmanager.service.ts
// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//   const token = await this.authService.getToken();
//   if (!token) {
//     throw new Error('No authentication token available');
//   }

//   const headers = new HttpHeaders()
//     .set('Authorization', `Bearer ${token}`)
//     .set('Content-Type', 'application/json');

//   // Move to permanent storage
//   const response = await this.http.post<any>(
//     `${this.baseUrl}/api/storage/move/${userId}`,
//     { fileName: this.getFileNameFromUrl(imageUrl) },
//     { headers }
//   ).toPromise();

//   if (!response.success) {
//     throw new Error('Failed to save image');
//   }

//   return response.url;
// }

// imageurlmanager.service.ts
async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
  try {
    if (!this.stagedFileName) {
      throw new Error('No staged file to move');
    }

    const token = await this.authService.getToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    // Match the exact route from your backend
    const response = await firstValueFrom(
      this.http.post<any>(
        `${environment.apiUrl}/api/storage/move/${userId}`, // Matches backend route
        { fileName: this.stagedFileName },
        {
          headers: new HttpHeaders()
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'application/json')
        }
      )
    );

    if (!response.success) {
      throw new Error('Failed to move file to permanent storage');
    }

    // Clear staging info
    this.clearStagedFile();

    return response.url;
  } catch (error) {
    console.error('Error saving profile image:', error);
    throw error;
  }
}

// Helper method to generate correct URLs for images
getImageUrl(userId: string, fileName: string, isStaged: boolean = false): string {
  const base = `${environment.apiUrl}/api/storage`;
  if (isStaged) {
    return `${base}/staging/profileImages/${userId}/${fileName}`;
  }
  return `${base}/profileImages/${userId}/${fileName}`;
}


// private getFileNameFromUrl(url: string): string {
//   const splitUrl = url.split('/');
//   return splitUrl[splitUrl.length - 1].split('?')[0];
// }

//   private getFileNameFromUrl(url: string): string {
//     try {
//       const decodedUrl = decodeURIComponent(url);
      
//       // Extract filename from Firebase URL
//       if (url.includes('firebasestorage.googleapis.com')) {
//         const matches = decodedUrl.match(/\/o\/(.+?)\?/);
//         if (matches && matches[1]) {
//           const fullPath = matches[1];
//           return fullPath.split('/').pop() || '';
//         }
//       }
      
//       // Extract filename from proxied URL
//       if (url.includes('/api/storage/')) {
//         const segments = decodedUrl.split('/');
//         return segments[segments.length - 1];
//       }
      
//       throw new Error('Invalid URL format');
//     } catch (error) {
//       console.error('Error extracting filename from URL:', error);
//       throw error;
//     }
//   }

// private getFileNameFromUrl(url: string): string {
//     console.log('URL received in getFileNameFromUrl:', url);
//     try {
//       const decodedUrl = decodeURIComponent(url);
  
//       if (url.includes('firebasestorage.googleapis.com')) {
//         const matches = decodedUrl.match(/\/o\/(.+?)\?/);
//         if (matches && matches[1]) {
//           const fullPath = matches[1];
//           return fullPath.split('/').pop() || '';
//         }
//       } else if (url.includes('/api/storage/')) {
//         const segments = decodedUrl.split('/');
//         return segments[segments.length - 1];
//       } else {
//         // Attempt to extract the filename after the last slash
//         const lastSlashIndex = url.lastIndexOf('/');
//         if (lastSlashIndex !== -1) {
//           const fileName = url.substring(lastSlashIndex + 1).split('?')[0];
//           return fileName;
//         }
//       }
  
//       throw new Error('Invalid URL format');
//     } catch (error) {
//       console.error('Error extracting filename from URL:', error);
//       throw error;
//     }
//   }

private getFileNameFromUrl(url: string): string {
  try {
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Processing URL:', url);
    const decodedUrl = decodeURIComponent(url);

    // Handle different URL types
    if (url.includes('firebasestorage.googleapis.com')) {
      // Firebase Storage URLs: Extract from /o/ path
      const matches = decodedUrl.match(/\/o\/(.+?)\?/);
      if (matches && matches[1]) {
        const fullPath = matches[1];
        return fullPath.split('/').pop() || '';
      }
    } else if (url.includes('/api/storage/')) {
      // Local API storage URLs
      const segments = decodedUrl.split('/');
      return segments[segments.length - 1];
    } else if (url.includes('unsplash.com')) {
      // Unsplash URLs: Extract photo ID and add extension
      const photoId = url.match(/\/photos\/([a-zA-Z0-9-_]+)/)?.[1];
      if (photoId) {
        return `unsplash-${photoId}.jpg`;
      }
    } else {
      // Generic URLs: Get last segment and remove query parameters
      const lastSlashIndex = url.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const fileName = url.substring(lastSlashIndex + 1).split('?')[0];
        // Ensure we have a valid filename
        if (fileName && !fileName.includes('/')) {
          return fileName;
        }
      }
    }

    // Generate a fallback filename if nothing else works
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `image-${timestamp}-${randomString}.jpg`;

  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    throw new Error(`Failed to extract filename from URL: ${error as any}.message}`);
  }
}

private isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowercaseUrl = url.toLowerCase();
  return (
    // Check extensions
    imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
    // Check Unsplash
    lowercaseUrl.includes('unsplash.com/photos/') ||
    // Check Firebase storage image
    (lowercaseUrl.includes('firebasestorage.googleapis.com') && 
     imageExtensions.some(ext => lowercaseUrl.includes(ext)))
  );
}

private isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async handleImageUrl(url: string): Promise<string> {
  try {
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }

    if (!this.isImageUrl(url)) {
      throw new Error('URL does not point to a supported image format');
    }

    const fileName = this.getFileNameFromUrl(url);
    console.log('Extracted filename:', fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error handling image URL:', error);
    throw error;
  }
}

  clearStagedFile() {
    this.stagedUrl = null;
    this.stagedFileName = null;
  }

  getStagedFileInfo(): { url: string | null; fileName: string | null } {
    return {
      url: this.stagedUrl,
      fileName: this.stagedFileName
    };
  }

//   clearStagedUrl() {
//     this.stagedUrl = null;
//   }

  async getDisplayUrl(userId: string, imageUrl: string | null): Promise<string> {
    if (!imageUrl) return '';

    // Always convert Firebase URLs to proxied URLs for display
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      return this.storageService.convertFirebaseUrl(imageUrl);
    }

    return imageUrl;
  }

  isFirebaseUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
  }

  isProxiedUrl(url: string): boolean {
    return url.includes('/api/storage/');
  }

  isStagedUrl(url: string): boolean {
    return url.includes('/staging/');
  }
  
}


// This is the new code
// import { Injectable } from '@angular/core';
// import { StorageService } from './storage.service';
// import { FirebaseService } from './firebase.service';
// import { HttpClient } from '@angular/common/http';

// @Injectable({
//   providedIn: 'root'
// })
// export class ImageUrlManagerService {
//   private stagedUrl: string | null = null;
//   private stagedFileName: string | null = null;
//   private originalUrl: string | null = null;

//   constructor(
//     private storageService: StorageService,
//     private firebaseService: FirebaseService,
//     private http: HttpClient
//   ) {}

//   async handleImageUpload(input: File | string, userId: string): Promise<string> {
//     try {
//       // Store current URL before changes
//       if (!this.originalUrl) {
//         this.originalUrl = this.stagedUrl;
//       }

//       // Clean up any existing staged file
//       if (this.stagedUrl) {
//         await this.firebaseService.cleanupStagedFile(userId);
//         this.clearStagedFile();
//       }

//       if (typeof input === 'string') {
//         const url = input.trim();
        
//         // Return existing Firebase or proxied URLs as-is
//         if (this.isFirebaseUrl(url) || this.isProxiedUrl(url)) {
//           return url;
//         }

//         // For external URLs, validate and return as-is
//         try {
//           new URL(url);
//           return url;
//         } catch {
//           throw new Error('Invalid URL format');
//         }
//       }

//       // Handle file uploads
//       const firebaseUrl = await this.firebaseService.uploadFile(input, userId);
//       this.stagedUrl = firebaseUrl;
//       this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);
//       return this.storageService.convertFirebaseUrl(firebaseUrl);

//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

//   async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//     try {
//       // For external URLs (like Unsplash), return as-is
//       if (!this.isFirebaseUrl(imageUrl) && !this.isProxiedUrl(imageUrl)) {
//         this.originalUrl = imageUrl;
//         return imageUrl;
//       }

//       // For staged files
//       if (this.stagedUrl && this.isStagedUrl(imageUrl)) {
//         if (!this.stagedFileName) {
//           throw new Error('No staged filename found');
//         }

//         const permanentUrl = await this.firebaseService.moveToPermStorage(userId, this.stagedFileName);
//         this.originalUrl = permanentUrl;
//         this.clearStagedFile();
//         return permanentUrl;
//       }

//       // Store as original URL
//       this.originalUrl = imageUrl;
//       return imageUrl;
//     } catch (error) {
//       console.error('Error saving profile image:', error);
//       throw error;
//     }
//   }

//   private getFileNameFromUrl(url: string): string {
//     try {
//       const decodedUrl = decodeURIComponent(url);
      
//       // Extract filename from Firebase URL
//       if (url.includes('firebasestorage.googleapis.com')) {
//         const matches = decodedUrl.match(/\/o\/(.+?)\?/);
//         if (matches && matches[1]) {
//           const fullPath = matches[1];
//           return fullPath.split('/').pop() || '';
//         }
//       }
      
//       // Extract filename from proxied URL
//       if (url.includes('/api/storage/')) {
//         const segments = decodedUrl.split('/');
//         return segments[segments.length - 1];
//       }
      
//       throw new Error('Invalid URL format');
//     } catch (error) {
//       console.error('Error extracting filename from URL:', error);
//       throw error;
//     }
//   }

//   clearStagedFile() {
//     this.stagedUrl = null;
//     this.stagedFileName = null;
//   }

//   getStagedFileInfo(): { url: string | null; fileName: string | null } {
//     return {
//       url: this.stagedUrl,
//       fileName: this.stagedFileName
//     };
//   }

//   async getDisplayUrl(userId: string, imageUrl: string | null): Promise<string> {
//     if (!imageUrl) return '';
    
//     return this.isFirebaseUrl(imageUrl) ? 
//       this.storageService.convertFirebaseUrl(imageUrl) : 
//       imageUrl;
//   }

//   async cancelChanges(): Promise<string | null> {
//     return this.originalUrl;
//   }

//   isFirebaseUrl(url: string): boolean {
//     return url?.includes('firebasestorage.googleapis.com') || false;
//   }

//   isProxiedUrl(url: string): boolean {
//     return url?.includes('/api/storage/') || false;
//   }

//   isStagedUrl(url: string): boolean {
//     return url?.includes('/staging/') || false;
//   }
// }