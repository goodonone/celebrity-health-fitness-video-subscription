import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, firstValueFrom } from 'rxjs';

interface ImageProvider {
  name: string;
  domain: string;
  urlPattern: RegExp;
  extractImageUrl: (url: string) => string | null;
}

interface UploadResponse {
  success: boolean;
  fileName: string;
  filePath: string;
  contentType: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUrlManagerService {
    private stagedUrl: string | null = null;
    private stagedFileName: string | null = null;
    private readonly baseUrl = environment.apiUrl;
    private stagedFiles = new Map<string, { url: string; fileName: string }>();
    private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  // Define supported image providers
  private readonly imageProviders: ImageProvider[] = [
    {
      name: 'Unsplash',
      domain: 'unsplash.com',
      urlPattern: /^https?:\/\/(?:.*\.)?unsplash\.com\/photos\/([a-zA-Z0-9-_]+)/,
      extractImageUrl: (url: string) => {
        const match = url.match(this.imageProviders[0].urlPattern);
        return match ? `https://images.unsplash.com/photo-${match[1]}?auto=format&fit=crop&w=1200` : null;
      }
    },
    {
      name: 'Pexels',
      domain: 'pexels.com',
      urlPattern: /^https?:\/\/(?:.*\.)?pexels\.com\/[^\s/]+\/([0-9]+)/,
      extractImageUrl: (url: string) => {
        const match = url.match(this.imageProviders[1].urlPattern);
        return match ? `https://images.pexels.com/photos/${match[1]}/pexels-photo-${match[1]}.jpeg` : null;
      }
    },
    {
      name: 'Pixabay',
      domain: 'pixabay.com',
      urlPattern: /^https?:\/\/(?:.*\.)?pixabay\.com\/[^\s/]+\/([^/]+)-([0-9]+)\/?/,
      extractImageUrl: (url: string) => {
        const match = url.match(this.imageProviders[2].urlPattern);
        return match ? `https://pixabay.com/get/${match[2]}_1280.jpg` : null;
      }
    }
  ];
  

  constructor(
    private storageService: StorageService,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   console.log('Starting image upload process...', { userId });
//   try {

//     // Wait for token initialization before proceeding
//     const token = await this.authService.waitForToken();
//     if (!token) {
//       throw new Error('Failed to initialize authentication token');
//     }

//     const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
//     console.log('Firebase upload complete:', { firebaseUrl });
    
//     this.stagedUrl = firebaseUrl;
//     this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);

//     console.log('Staging info set:', { 
//       stagedUrl: this.stagedUrl,
//       stagedFileName: this.stagedFileName 
//     });
    
//     const displayUrl = await this.storageService.convertFirebaseUrl(firebaseUrl);
//     // Properly append token
//     // const separator = displayUrl.includes('?') ? '&' : '?';
//     // displayUrl = `${displayUrl}${separator}token=${token}`;
//     console.log('Converted to proxied URL:', { displayUrl });
    
//     // const token = await this.authService.getToken();
//     // console.log('Got auth token:', { hasToken: !!token });

//     // const finalUrl = `${displayUrl}?token=${token}`;
//     // console.log('Final URL generated:', { 
//     //   finalUrl: finalUrl.substring(0, 50) + '...' 
//     // });
//     // Convert to display URL without appending token
    
//     return displayUrl;
//   } catch (error: any) {
//     console.error('Error in handleImageUpload:', error);
//     if (error.message === 'Authentication required') {
//       // Handle auth error (e.g., redirect to login)
//       throw new Error('Please log in to upload images');
//     }
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     const token = await this.authService.waitForToken();
//     if (!token) throw new Error('Authentication required');

//     // Upload file
//     const firebaseUrl = await this.firebaseService.uploadFile(file, userId);
    
//     // Store staging info
//     this.stagedUrl = firebaseUrl;
//     this.stagedFileName = this.getFileNameFromUrl(firebaseUrl);

//     // Convert to display URL
//     return await this.storageService.convertFirebaseUrl(firebaseUrl);
//   } catch (error) {
//     console.error('Error in handleImageUpload:', error);
//     if ((error as any)?.status === 401) {
//       this.authService.logout();
//     }
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // 1. Validate file
//     await this.validateFile(file);

//     // 2. Get and verify auth token
//     const token = await this.authService.waitForToken();
//     if (!token) {
//       throw new Error('Authentication required');
//     }

//     // 3. Prepare upload
//     const formData = new FormData();
//     formData.append('file', file);

//     const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

//     // 4. Upload file to staging
//     const response = await firstValueFrom(
//       this.http.post<{
//         success: boolean;
//         fileName: string;
//         filePath: string;
//         contentType: string;
//       }>(
//         `${environment.apiUrl}/api/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(async (error) => {
//           if (error.status === 401) {
//             await this.authService.refreshToken();
//             // Retry with new token
//             const newToken = await this.authService.getToken();
//             const newHeaders = new HttpHeaders().set('Authorization', `Bearer ${newToken}`);
//             return this.http.post<any>(
//               `${environment.apiUrl}/api/upload/${userId}`,
//               formData,
//               { headers: newHeaders }
//             );
//           }
//           throw this.handleUploadError(error);
//         })
//       )
//     );

//     // 5. Validate response
//     if (!response.success || !response.fileName || !response.filePath) {
//       throw new Error('Upload response invalid');
//     }

//     // 6. Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     // 7. Generate display URL
//     const displayUrl = await this.storageService.generateImageUrl(
//       userId,
//       response.fileName,
//       true // isStaged = true
//     );

//     return displayUrl;

//   } catch (error) {
//     console.error('Image upload error:', error);
//     this.handleUploadError(error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Get and verify auth token
//     const token = await this.authService.waitForToken();
//     if (!token) {
//       throw new Error('Authentication required');
//     }

//     // Prepare upload
//     const formData = new FormData();
//     formData.append('file', file);

//     const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

//     // Upload file
//     const response = await firstValueFrom(
//       this.http.post<{
//         success: boolean;
//         fileName: string;
//         filePath: string;
//       }>(
//         `${this.baseUrl}/api/images/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(async (error) => {
//           console.error('Upload request failed:', error);
//           if (error.status === 401) {
//             this.authService.refreshToken();
//           }
//           throw error;
//       })
//      )
//     );

//     // Validate response
//     if (!response.success || !response.fileName || !response.filePath) {
//       throw new Error('Upload response invalid');
//     }

//     // Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     // Generate display URL - pass all required parameters
//     const displayUrl = await this.storageService.generateImageUrl(
//       userId,
//       response.fileName,
//       true  // isStaged
//     );

//     return displayUrl;

//   } catch (error) {
//     console.error('Image upload error:', error);
//     // if ((error as any)?.status === 401) {
//       // this.authService.logout();
//       // this.authService.refreshToken();
//     // }
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Validate file first
//     if (!file) throw new Error('No file provided');

//     const formData = new FormData();
//     formData.append('file', file);

//     const token = await this.authService.waitForToken();
//     if (!token) throw new Error('Authentication required');

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`);

//     console.log('SENDING upload request:', { 
//       url: `${this.baseUrl}/api/images/upload/${userId}`,
//       fileType: file.type,
//       fileSize: file.size
//     });  

//     // Make request and handle response
//     const response = await firstValueFrom(
//       this.http.post<{
//         success: boolean;
//         fileName: string;
//         filePath: string;
//         contentType: string;
//         message?: string;
//         error?: string;
//       }>(
//         `${this.baseUrl}/api/images/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(error => {
//           console.error('HTTP Error:', error);
//           if (error.status === 401) {
//             this.authService.refreshToken();
//           }
//           throw new Error(error.error?.message || 'Upload failed');
//         })
//       )
//     );

//     console.log('Upload response received:', response);

//     // Validate response
//     if (!response.success) {
//       throw new Error(response.message || 'Upload failed');
//     }

//     if (!response.fileName || !response.filePath) {
//       console.error('Invalid response structure:', response);
//       throw new Error('Invalid server response');
//     }

//     // Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     console.log('Staged file info stored:', {
//       userId,
//       fileName: response.fileName,
//       filePath: response.filePath
//     });

//     // // Generate display URL
//     // return await this.storageService.generateImageUrl(
//     //   userId,
//     //   response.fileName,
//     //   true // isStaged
//     // );
//     // Generate display URL
//     const displayUrl = await this.storageService.generateImageUrl(
//       userId,
//       response.fileName,
//       true // isStaged
//     );

//     console.log('Generated display URL:', displayUrl);

//     return displayUrl;
//   } catch (error) {
//     console.error('Image upload error:', error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     if (!file) throw new Error('No file provided');

//     const formData = new FormData();
//     formData.append('file', file);

//     const token = await this.authService.waitForToken();
//     if (!token) throw new Error('Authentication required');

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`);

//     console.log('Sending upload request:', { 
//       url: `${this.baseUrl}/api/images/upload/${userId}`,
//       fileType: file.type,
//       fileSize: file.size
//     });

//     // Make request and handle response
//     const response = await firstValueFrom(
//       this.http.post<UploadResponse>(
//         `${this.baseUrl}/api/images/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(error => {
//           console.error('HTTP Error:', error);
//           const message = error.error?.message || 'Upload failed';
//           throw new Error(message);
//         })
//       )
//     );

//     console.log('Upload response received:', response);

//     // Validate response fields
//     if (!response.success) {
//       throw new Error(response.message || 'Upload failed');
//     }

//     if (!response.fileName || !response.filePath) {
//       console.error('Invalid response structure:', response);
//       throw new Error('Server response missing required fields');
//     }

//     // Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     console.log('Staged file info stored:', {
//       userId,
//       fileName: response.fileName,
//       filePath: response.filePath
//     });

//     // Generate display URL
//     const displayUrl = await this.storageService.generateImageUrl(
//       userId,
//       response.fileName,
//       true // isStaged
//     );

//     console.log('Generated display URL:', displayUrl);

//     return displayUrl;

//   } catch (error) {
//     console.error('Image upload error:', error);
//     throw error;
//   }
// }
async handleImageUpload(file: File, userId: string): Promise<string> {
  try {
    if (!file) throw new Error('No file provided');

    const formData = new FormData();
    formData.append('file', file);

    const token = await this.authService.waitForToken();
    if (!token) throw new Error('Authentication required');

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    // Upload file
    const response = await firstValueFrom(
      this.http.post<{
        success: boolean;
        fileName: string;
        filePath: string;
        contentType: string;
      }>(
        `${this.baseUrl}/api/images/upload/${userId}`,
        formData,
        { headers }
      ).pipe(
        catchError(error => {
          console.error('Upload error:', error);
          throw new Error(error.error?.message || 'Upload failed');
        })
      )
    );

    if (!response.success) {
      throw new Error('Upload failed');
    }

    // Store staging info
    this.stagedFiles.set(userId, {
      fileName: response.fileName,
      url: response.filePath
    });

    // Generate display URL
    const displayUrl = await this.storageService.generateImageUrl(
      userId,
      response.fileName,
      true
    );

    return displayUrl;

  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}


// Add better error logging
private handleUploadError(error: any): Error {
  let message = 'Upload failed';
  
  if (error.status === 401) {
    message = 'Authentication failed';
  } else if (error.status === 413) {
    message = 'File too large';
  } else if (error.status === 415) {
    message = 'Unsupported file type';
  } else if (error.error?.message) {
    message = error.error.message;
  }

  return new Error(message);
}


private async validateFile(file: File): Promise<void> {
  // Size validation
  if (file.size > this.MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  // Type validation
  if (!this.ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
  }

  // Additional image validation if needed
  await this.validateImage(file);
}

private async validateImage(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      // Add any dimension or other checks here
      resolve();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image file'));
    };

    img.src = url;
  });
}

// private handleUploadError(error: any): Error {
//   if (error.status === 401) {
//     this.authService.logout();
//     return new Error('Authentication failed');
//   }
//   if (error.status === 413) {
//     return new Error('File too large');
//   }
//   if (error.status === 415) {
//     return new Error('File type not supported');
//   }
//   return new Error('Upload failed: ' + (error.message || 'Unknown error'));
// }

// Helper methods for staged files
hasStagedFile(userId: string): boolean {
  return this.stagedFiles.has(userId);
}

// getStagedFile(userId: string): { fileName: string; url: string } | null {
//   return this.stagedFiles.get(userId) || null;
// }

clearStagedFile(userId: string): void {
  this.stagedFiles.delete(userId);
  this.stagedUrl = null;
  this.stagedFileName = null;
}

// clearStagedFile() {
//   this.stagedUrl = null;
//   this.stagedFileName = null;
// }

// // Get filename from URL or path
// getFileNameFromUrl(url: string): string {
//   if (!url) throw new Error('URL is required');

//   try {
//     // Handle different URL formats
//     if (url.includes('firebasestorage.googleapis.com')) {
//       const matches = url.match(/\/o\/(.+?)\?/);
//       if (matches && matches[1]) {
//         const fullPath = decodeURIComponent(matches[1]);
//         return fullPath.split('/').pop() || '';
//       }
//     }

//     if (url.includes('/api/storage/')) {
//       return url.split('/').pop()?.split('?')[0] || '';
//     }

//     // Handle storage paths
//     if (url.includes('profileImages/')) {
//       return url.split('/').pop() || '';
//     }

//     throw new Error('Invalid URL format');
//   } catch (error) {
//     console.error('Error extracting filename:', error);
//     throw new Error('Could not extract filename from URL');
//   }
// }


// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//   try {
//     if (!this.stagedFileName) {
//       throw new Error('No staged file to move');
//     }

//    // Wait for token initialization
//    const token = await this.authService.waitForToken();
//    if (!token) {
//      throw new Error('No authentication token available');
//    }

//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${environment.apiUrl}/api/storage/move/${userId}`,
//         { fileName: this.stagedFileName },
//         {
//           headers: new HttpHeaders()
//             .set('Authorization', `Bearer ${token}`)
//             .set('Content-Type', 'application/json')
//         }
//       )
//     ).catch((error) => {
//       console.error('Error saving profile image:', error);
//       throw new Error('Failed to save profile image');
//     });

//     if (!response.success) {
//       throw new Error('Failed to move file to permanent storage');
//     }

//     // Store the base URL without query parameters
//     const baseUrl = response.url;
//     this.clearStagedFile();
    
//     return baseUrl;
//   } catch (error) {
//     console.error('Error saving profile image:', error);
//     throw error;
//   }
// // }
// async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
//   try {
//     if (!this.stagedFileName) {
//       throw new Error('No staged file to move');
//     }

//     const token = await this.authService.waitForToken();
//     if (!token) {
//       throw new Error('No authentication token available');
//     }

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`)
//       .set('Content-Type', 'application/json');

//     const response = await firstValueFrom(
//       this.http.post<{success: boolean; url: string}>(
//         `${this.baseUrl}/api/storage/move/${userId}`,
//         { fileName: this.stagedFile.fileName },
//         { headers }
//       )
//     ).catch((error) => {
//       if (error.status === 401) {
//         throw error; // Let the component handle token expiration
//       }
//         throw new Error('Failed to save profile image');
//     });

//     if (!response.success || !response.url) {
//       throw new Error('Failed to move file to permanent storage');
//     }

//     // Convert the Firebase URL to a proxied URL for display
//     // const displayUrl = await this.storageService.convertFirebaseUrl(response.url);
//     // const displayUrl = this.storageService.generateImageUrl(userId, this.stagedFileName);

//     // Clear staging info
//     // this.clearStagedFile();

//     // Generate display URL with all required parameters
//     const displayUrl = await this.storageService.generateImageUrl(
//       userId,
//       response.fileName,
//       false  // Not staged anymore
//     );

//     // Clear staging info
//     this.stagedFiles.delete(userId);
    
//     return displayUrl;
//   } catch (error) {
//     console.error('Error saving profile image:', error);
//     throw error;
//   }
// }

async saveProfileImage(userId: string, imageUrl: string): Promise<string> {
  try {
    const stagedFile = this.stagedFiles.get(userId);
    if (!stagedFile) {
      throw new Error('No staged file to move');
    }

    const token = await this.authService.waitForToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    const response = await firstValueFrom(
      this.http.post<{ success: boolean; fileName: string }>(
        `${this.baseUrl}/api/images/move/${userId}`,
        { fileName: stagedFile.fileName },
        { headers }
      )
    ).catch((error) => {
      if (error.status === 401) {
        throw error; // Let the component handle token expiration
      }
      throw new Error('Failed to save profile image');
    });

    if (!response.success || !response.fileName) {
      throw new Error('Failed to move file to permanent storage');
    }

    // Generate display URL with all required parameters
    const displayUrl = await this.storageService.generateImageUrl(
      userId,
      response.fileName,
      false  // Not staged anymore
    );

    // Clear staging info
    this.stagedFiles.delete(userId);

    return displayUrl;

  } catch (error) {
    console.error('Error saving profile image:', error);
    throw error;
  }
}

// hasStagedFile(userId: string): boolean {
//   return this.stagedFiles.has(userId);
// }

getStagedFile(userId: string): { fileName: string; url: string } | null {
  return this.stagedFiles.get(userId) || null;
}

// clearStagedFile(userId: string): void {
//   this.stagedFiles.delete(userId);
// }


// Helper method to generate correct URLs for images
getImageUrl(userId: string, fileName: string, isStaged: boolean = false): string {
  const base = `${environment.apiUrl}/api/storage`;
  if (isStaged) {
    return `${base}/staging/profileImages/${userId}/${fileName}`;
  }
  return `${base}/profileImages/${userId}/${fileName}`;
}

// private getFileNameFromUrl(url: string): string {
//   try {
//     if (!url) {
//       throw new Error('URL is required');
//     }

//     console.log('Processing URL:', url);
//     const decodedUrl = decodeURIComponent(url);

//     // Handle different URL types
//     if (url.includes('firebasestorage.googleapis.com')) {
//       // Firebase Storage URLs: Extract from /o/ path
//       const matches = decodedUrl.match(/\/o\/(.+?)\?/);
//       if (matches && matches[1]) {
//         const fullPath = matches[1];
//         return fullPath.split('/').pop() || '';
//       }
//     } else if (url.includes('/api/storage/')) {
//       // Local API storage URLs
//       const segments = decodedUrl.split('/');
//       return segments[segments.length - 1];
//     } else if (url.includes('unsplash.com')) {
//       // Unsplash URLs: Extract photo ID and add extension
//       const photoId = url.match(/\/photos\/([a-zA-Z0-9-_]+)/)?.[1];
//       if (photoId) {
//         return `unsplash-${photoId}.jpg`;
//       }
//     } else {
//       // Generic URLs: Get last segment and remove query parameters
//       const lastSlashIndex = url.lastIndexOf('/');
//       if (lastSlashIndex !== -1) {
//         const fileName = url.substring(lastSlashIndex + 1).split('?')[0];
//         // Ensure we have a valid filename
//         if (fileName && !fileName.includes('/')) {
//           return fileName;
//         }
//       }
//     }

//     // Generate a fallback filename if nothing else works
//     const timestamp = Date.now();
//     const randomString = Math.random().toString(36).substring(2, 8);
//     return `image-${timestamp}-${randomString}.jpg`;

//   } catch (error) {
//     console.error('Error extracting filename from URL:', error);
//     throw new Error(`Failed to extract filename from URL: ${error as any}.message}`);
//   }
// }

getFileNameFromUrl(url: string): string {
  try {
    if (!url) {
      throw new Error('URL is required');
    }

    const decodedUrl = decodeURIComponent(url);

    // Handle different URL types
    if (url.includes('firebasestorage.googleapis.com')) {
      const matches = decodedUrl.match(/\/o\/(.+?)\?/);
      if (matches && matches[1]) {
        const fullPath = matches[1];
        return fullPath.split('/').pop()?.split('?')[0] || '';
      }
    } else if (url.includes('/api/storage/')) {
      const segments = decodedUrl.split('/');
      return segments[segments.length - 1].split('?')[0];
    }

    // For provider URLs, generate a meaningful filename
    const provider = this.detectImageProvider(url);
    if (provider) {
      const timestamp = Date.now();
      return `${provider.name.toLowerCase()}-${timestamp}.jpg`;
    }

    // Generic URLs
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || '';
    
    if (fileName && !fileName.includes('/')) {
      return fileName.split('?')[0];
    }

    // Fallback
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `image-${timestamp}-${randomString}.jpg`;

  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    throw new Error(`Failed to extract filename: ${(error as Error).message}`);
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

// async handleImageUrl(url: string): Promise<string> {
//   try {
//     if (!this.isValidUrl(url)) {
//       throw new Error('Invalid URL format');
//     }
    

//     if (!this.isImageUrl(url)) {
//       throw new Error('URL does not point to a supported image format');
//     }

//     const fileName = this.getFileNameFromUrl(url);
//     console.log('Extracted filename:', fileName);
    
//     return fileName;
//   } catch (error) {
//     console.error('Error handling image URL:', error);
//     throw error;
//   }
// }

// async handleImageUrl(url: string): Promise<string> {
//   try {
//     // Validate URL format
//     if (!this.isValidUrl(url)) {
//       throw new Error('Invalid URL format');
//     }

//     // Check if it's a direct image URL
//     if (this.isDirectImageUrl(url)) {
//       return this.processDirectImageUrl(url);
//     }

//     // Check for supported image providers
//     const provider = this.detectImageProvider(url);
//     if (provider) {
//       const imageUrl = provider.extractImageUrl(url);
//       if (imageUrl) {
//         return this.processDirectImageUrl(imageUrl);
//       }
//     }

//     throw new Error('Unsupported image URL format');
//   } catch (error) {
//     console.error('Error handling image URL:', error);
//     throw error;
//   }
// }

// async handleImageUrl(url: string): Promise<string> {
//   try {
//     if (!url) return '';

//     // Check if it's a Firebase URL first
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return this.storageService.convertFirebaseUrl(url);
//     }

//     // Try to validate and process the URL
//     const processedUrl = await this.processUrl(url);
//     if (!processedUrl) {
//       throw new Error('Invalid or unsupported image URL');
//     }

//     // Verify the image is accessible
//     await this.verifyImageAccess(processedUrl);

//     return processedUrl;
//   } catch (error) {
//     console.error('Error handling image URL:', error);
//     throw error;
//   }
// }

// async handleImageUrl(url: string): Promise<string> {
//   try {
//     if (!url) return '';

//     // Check if it's a Firebase URL first
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return this.storageService.convertFirebaseUrl(url);
//     }

//     // Check for provider-specific URLs first
//     const provider = this.detectImageProvider(url);
//     if (provider) {
//       const imageUrl = provider.extractImageUrl(url);
//       if (imageUrl) {
//         await this.verifyImageAccess(imageUrl);
//         return imageUrl;
//       }
//     }

//     // If not a provider URL, validate as direct image URL
//     if (this.isDirectImageUrl(url)) {
//       await this.verifyImageAccess(url);
//       return url;
//     }

//     throw new Error('Invalid or unsupported image URL');
//   } catch (error) {
//     console.error('Error handling image URL:', error);
//     throw error;
//   }
// }

async handleImageUrl(url: string): Promise<string> {
  try {
    if (!url) return '';

    // Handle API URLs - append auth token
    if (url.startsWith('/api/')) {
      const token = await this.authService.getToken();
      return `${this.baseUrl}${url}?token=${token}`;
    }

    // Handle Firebase Storage URLs
    if (url.includes('firebasestorage.googleapis.com')) {
      return this.storageService.convertFirebaseUrl(url);
    }

    // Handle provider-specific URLs (Unsplash, etc.)
    const provider = this.detectImageProvider(url);
    if (provider) {
      const imageUrl = provider.extractImageUrl(url);
      if (imageUrl) {
        await this.verifyImageAccess(imageUrl);
        return imageUrl;
      }
    }

    // Handle direct image URLs
    if (this.isDirectImageUrl(url)) {
      await this.verifyImageAccess(url);
      return url;
    }

    throw new Error('Invalid or unsupported image URL');
  } catch (error) {
    console.error('Error handling image URL:', error);
    throw error;
  }
}

private async processUrl(url: string): Promise<string | null> {
  try {
    // Validate URL format
    new URL(url);

    // Check for provider-specific URLs
    for (const provider of this.imageProviders) {
      if (url.includes(provider.domain)) {
        const imageUrl = provider.extractImageUrl(url);
        if (imageUrl) return imageUrl;
      }
    }

    // Check if it's already a direct image URL
    if (this.isDirectImageUrl(url)) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

  // clearStagedFile() {
  //   this.stagedUrl = null;
  //   this.stagedFileName = null;
  // }

  // getStagedFileInfo(): { url: string | null; fileName: string | null } {
  //   return {
  //     url: this.stagedUrl,
  //     fileName: this.stagedFileName
  //   };
  // }

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

  // private isDirectImageUrl(url: string): boolean {
  //   const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  //   const lowercaseUrl = url.toLowerCase();
  //   return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
  //          this.hasImageMimeTypeParam(url);
  // }

private isDirectImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowercaseUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
  this.hasImageMimeTypeParam(url);
}  

  private hasImageMimeTypeParam(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const contentType = urlObj.searchParams.get('content-type') || 
                         urlObj.searchParams.get('mime-type') ||
                         urlObj.searchParams.get('type');
      return contentType ? contentType.startsWith('image/') : false;
    } catch {
      return false;
    }
  }

  private detectImageProvider(url: string): ImageProvider | null {
    return this.imageProviders.find(provider => url.includes(provider.domain)) || null;
  }

  private async processDirectImageUrl(url: string): Promise<string> {
    try {
      // Verify image exists and is accessible
      await this.verifyImageAccess(url);
      return url;
    } catch (error) {
      throw new Error(`Failed to access image: ${(error as Error).message}`);
    }
  }

  // private async verifyImageAccess(url: string): Promise<void> {
  //   try {
  //     const response = await fetch(url, { method: 'HEAD' });
  //     if (!response.ok) {
  //       throw new Error('Image not accessible');
  //     }
      
  //     const contentType = response.headers.get('content-type');
  //     if (!contentType?.startsWith('image/')) {
  //       throw new Error('URL does not point to an image');
  //     }
  //   } catch (error) {
  //     throw new Error(`Failed to verify image: ${(error as Error).message}`);
  //   }
  // }
  // private async verifyImageAccess(url: string): Promise<void> {
  //   try {
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  //     const response = await fetch(url, { 
  //       method: 'HEAD',
  //       signal: controller.signal
  //     });
  
  //     clearTimeout(timeoutId);
  
  //     if (!response.ok) {
  //       throw new Error('Image not accessible');
  //     }
      
  //     const contentType = response.headers.get('content-type');
  //     if (!contentType?.startsWith('image/')) {
  //       throw new Error('URL does not point to an image');
  //     }
  //   } catch (error: any) {
  //     if (error.name === 'AbortError') {
  //       throw new Error('Request timed out while verifying image');
  //     }
  //     throw new Error(`Failed to verify image: ${(error as Error).message}`);
  //   }
  // }  
  
  private async verifyImageAccess(url: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        throw new Error('Image not accessible');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out while verifying image');
      }
      throw new Error(`Failed to verify image: ${error.message}`);
    }
}

}
