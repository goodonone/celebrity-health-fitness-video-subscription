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

interface StagedFile {
  fileName: string;
  filePath: string; 
}

@Injectable({
  providedIn: 'root'
})
export class ImageUrlManagerService {
    private stagedUrl: string | null = null;
    private stagedFileName: string | null = null;
    private readonly baseUrl = environment.apiUrl;
    // private stagedFiles = new Map<string, { url: string; fileName: string }>();
    private stagedFiles: Map<string, StagedFile> = new Map();
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
//   try {
//     if (!file) throw new Error('No file provided');

//     const formData = new FormData();
//     formData.append('file', file);

//     const token = await this.authService.waitForToken();
//     if (!token) throw new Error('Authentication required');

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`);

//     // Upload file
//     const response = await firstValueFrom(
//       this.http.post<{
//         success: boolean;
//         fileName: string;
//         filePath: string;
//         contentType: string;
//       }>(
//         `${this.baseUrl}/api/images/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(error => {
//           console.error('Upload error:', error);
//           throw new Error(error.error?.message || 'Upload failed');
//         })
//       )
//     );

//     if (!response.success) {
//       throw new Error('Upload failed');
//     }

//     // Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     // Generate display URL
//     const displayUrl = await this.storageService.generateImageUrl(
//       userId,
//       response.fileName,
//       true
//     );

//     return displayUrl;

//   } catch (error) {
//     console.error('Image upload error:', error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     const formData = new FormData();
//     formData.append('file', file);

//     const token = await this.authService.waitForToken();
//     if (!token) throw new Error('Authentication required');

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`);

//     // Upload file
//     const response = await firstValueFrom(
//       this.http.post<{
//         success: boolean;
//         fileName: string;
//         filePath: string;
//         contentType: string;
//       }>(
//         `${this.baseUrl}/api/images/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(error => {
//           console.error('Upload error:', error);
//           throw new Error(error.error?.message || 'Upload failed');
//         })
//       )
//     );

//     if (!response.success) {
//       throw new Error('Upload failed');
//     }

//     // Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     // Return the file path (will be converted to proxied URL later)
//     return response.filePath;

//   } catch (error) {
//     console.error('Image upload error:', error);
//     throw error;
//   }
// }

// async handleImageUpload(file: File, userId: string): Promise<string> {
//   try {
//     // Validate inputs
//     if (!file || !userId) {
//       throw new Error('File and userId are required');
//     }

//     // Create form data
//     const formData = new FormData();
//     formData.append('file', file);

//     // Get auth token
//     const token = await this.authService.waitForToken();
//     if (!token) {
//       throw new Error('Authentication required');
//     }

//     // Set headers
//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`);

//     // Upload file
//     const response = await firstValueFrom(
//       this.http.post<{
//         success: boolean;
//         fileName: string;
//         filePath: string;
//         contentType: string;
//       }>(
//         `${this.baseUrl}/api/images/upload/${userId}`,
//         formData,
//         { headers }
//       ).pipe(
//         catchError(error => {
//           console.error('Upload error:', error);
//           throw new Error(error.error?.message || 'Upload failed');
//         })
//       )
//     );

//     if (!response.success) {
//       throw new Error('Upload failed');
//     }

//     console.log('Upload response:', {
//       fileName: response.fileName,
//       filePath: response.filePath
//     });

//     // Store staging info
//     this.stagedFiles.set(userId, {
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     console.log('Staged file stored:', {
//       userId,
//       fileName: response.fileName,
//       url: response.filePath
//     });

//     // Generate proxied URL immediately
//     try {
//       const displayUrl = await this.storageService.convertFirebaseUrl(response.filePath);
//       console.log('Generated display URL:', displayUrl);
      
//       // Verify the URL is accessible
//       const verifyHeaders = await this.storageService.getAuthHeaders();
//       const verifyResponse = await fetch(displayUrl, {
//         method: 'HEAD',
//         headers: verifyHeaders
//       });

//       if (!verifyResponse.ok) {
//         throw new Error('Generated URL not accessible');
//       }

//       return displayUrl;
//     } catch (urlError) {
//       console.error('Error generating display URL:', urlError);
//       // Fallback to returning the file path if URL generation fails
//       return response.filePath;
//     }

//   } catch (error) {
//     console.error('Image upload error:', error);
//     throw error;
//   }
// }


async handleImageUpload(file: File, userId: string): Promise<string> {
  try {
    // Upload using FirebaseService
    const downloadUrl = await this.firebaseService.uploadFile(file, userId);
    
    // Get staged file info from FirebaseService
    const stagedFile = this.firebaseService.getStagedFile(userId);
    if (stagedFile) {
      // Track the staged file in this service
      this.stagedFiles.set(userId, {
        fileName: stagedFile.fileName,
        filePath: stagedFile.filePath
      });
      console.log('Staged file stored:', {
        userId,
        fileName: stagedFile.fileName,
        filePath: stagedFile.filePath
      });
    }

    // Convert to display URL
    const displayUrl = await this.storageService.convertFirebaseUrl(downloadUrl);
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
  const hasFile = this.stagedFiles.has(userId);
  console.log('Checking staged file:', { userId, hasFile });
  return hasFile;
}

// getStagedFile(userId: string): { fileName: string; url: string } | null {
//   return this.stagedFiles.get(userId) || null;
// }

// clearStagedFile(userId: string): void {
//   console.log('Clearing staged file for:', userId);
//   this.stagedFiles.delete(userId);
//   this.stagedUrl = null;
//   this.stagedFileName = null;
// }

// clearStagedFile(userId: string): void {
//   console.log('Clearing staged file for:', userId);
//   this.stagedFiles.delete(userId);
//   // Also clear in FirebaseService
//   this.firebaseService.cleanupStagedFile(userId).catch(error => {
//     console.error('Error cleaning up Firebase staged file:', error);
//   });
//   this.stagedUrl = null;
//   this.stagedFileName = null;
// }

clearStagedFile(userId: string): void {
  console.log('Clearing staged file tracking for:', userId);
  this.stagedFiles.delete(userId);
  this.stagedUrl = null;
  this.stagedFileName = null;
}

async moveToPermStorage(userId: string, fileName: string): Promise<void> {
  try {
    const stagedFile = this.stagedFiles.get(userId);
    if (!stagedFile) {
      console.log('No staged file to move');
      return;
    }

    await this.firebaseService.moveToPermStorage(userId, fileName);
    this.clearStagedFile(userId);
    console.log('Successfully moved staged file to permanent storage');
  } catch (error) {
    console.error('Error moving staged file:', error);
    throw error;
  }
}

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

// getStagedFile(userId: string): { fileName: string; url: string } | null {
//     const file = this.stagedFiles.get(userId);
//     console.log('Getting staged file:', { userId, file });
//     return file || null;
//   }

getStagedFile(userId: string): StagedFile | null {
  const file = this.stagedFiles.get(userId);
  console.log('Getting staged file:', { userId, file });
  return file || null;
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
//     if (!url) return '';

//     // Handle API URLs - append auth token
//     if (url.startsWith('/api/')) {
//       const token = await this.authService.getToken();
//       return `${this.baseUrl}${url}?token=${token}`;
//     }

//     // Handle Firebase Storage URLs
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return this.storageService.convertFirebaseUrl(url);
//     }

//     // Handle provider-specific URLs (Unsplash, etc.)
//     const provider = this.detectImageProvider(url);
//     if (provider) {
//       const imageUrl = provider.extractImageUrl(url);
//       if (imageUrl) {
//         await this.verifyImageAccess(imageUrl);
//         return imageUrl;
//       }
//     }

//     // Handle direct image URLs
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

    // Handle provider-specific URLs first (Unsplash, etc.)
    const provider = this.detectImageProvider(url);
    if (provider) {
      const imageUrl = provider.extractImageUrl(url);
      if (imageUrl) {
        // Skip verification for provider URLs since they're trusted
        return imageUrl;
      }
    }

    // Handle API URLs - append auth token
    if (url.startsWith('/api/')) {
      const token = await this.authService.getToken();
      return `${this.baseUrl}${url}?token=${token}`;
    }

    // Handle Firebase Storage URLs
    if (url.includes('firebasestorage.googleapis.com')) {
      return this.storageService.convertFirebaseUrl(url);
    }

    // Handle direct image URLs
    if (this.isDirectImageUrl(url)) {
      await this.verifyImageAccess(url);
      return url;
    }

    // If we get here, the URL might still be valid but not in a format we recognize
    return url;

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

// private isDirectImageUrl(url: string): boolean {
//   const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
//   const lowercaseUrl = url.toLowerCase();
//   return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
//   this.hasImageMimeTypeParam(url);
// }  

private isDirectImageUrl(url: string): boolean {
  // Add common provider domains to skip validation
  const trustedDomains = [
    'unsplash.com',
    'images.unsplash.com',
    'pexels.com',
    'images.pexels.com',
    'pixabay.com'
  ];

  try {
    const urlObj = new URL(url);
    if (trustedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return true;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
           this.hasImageMimeTypeParam(url);
  } catch {
    return false;
  }
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