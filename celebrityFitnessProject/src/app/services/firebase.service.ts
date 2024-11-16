import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, firstValueFrom, from, Observable, of, Subject, switchMap, tap, throwError } from 'rxjs';
import { storage, auth } from '../firebase.config';
import { ref, uploadBytesResumable, getDownloadURL,  UploadTaskSnapshot, deleteObject, getStorage, getMetadata, listAll } from 'firebase/storage';
import { environment } from 'src/environments/environment';
// import { storage } from '../firebase.config'; // Make sure this is the Firebase Admin SDK import
// import { getStorage, ref, deleteObject } from 'firebase/storage';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

// Interfaces
interface UploadResponse {
  uploadUrl: string;
  fileName: string;
  fullPath: string;
  downloadUrl: string;
}

interface UploadProgress {
  progress: number;
  snapshot: UploadTaskSnapshot;
}

interface UploadResult {
  downloadUrl: string;
  path: string;
  metadata: {
    contentType: string;
    size: number;
    timeCreated: string;
  };
}

interface StagedFile {
  fileName: string;
  filePath: string; 
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly baseUrl = environment.apiUrl;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  private uploadProgress = new Subject<UploadProgress>();
  private stagedFiles: Map<string, StagedFile> = new Map();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  // Public Methods
  getUploadProgress(): Observable<UploadProgress> {
    return this.uploadProgress.asObservable();
  }

  hasStagedFile(userId: string): boolean {
    const hasFile = this.stagedFiles.has(userId);
    console.log('Checking staged file:', { userId, hasFile });
    return hasFile;
  }

  getStagedFilePath(userId: string): string | null {
    const stagedFile = this.stagedFiles.get(userId);
    return stagedFile ? stagedFile.filePath : null;
  }

  getStagedFile(userId: string): StagedFile | null {
    return this.stagedFiles.get(userId) || null;
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  // Auth Headers Methods
  private getAuthHeaders() {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No auth token available');
    }
    return {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    };
  }

  private getAuthHeadersWithContentType() {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No auth token available');
    }
    return {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    };
  }

  private async getAuthHeadersAsync(): Promise<{ headers: HttpHeaders }> {
    const token = await this.authService.waitForToken();
    if (!token) {
      throw new Error('No auth token available');
    }
    return {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    };
  }


// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     this.validateFile(file);
//     const processedFile = file.type.startsWith('image/') ? 
//       await this.compressImage(file) : file;

//     const storage = getStorage();
//     const timestamp = Date.now();
//     const filename = `${timestamp}-${file.name}`;
//     const storagePath = `staging/profileImages/${userId}/${filename}`;

//     // Track the staged file
//     this.stagedFiles.set(userId, {
//       fileName: filename,
//       filePath: storagePath
//     });
    
//     console.log('Tracking new staged file:', {
//       userId,
//       fileName: filename,
//       path: storagePath
//     });

//     const storageRef = ref(storage, storagePath);
    
//     const metadata = this.createUploadMetadata(userId, processedFile);
//     const uploadTask = uploadBytesResumable(storageRef, processedFile, metadata);

//     return new Promise((resolve, reject) => {
//       let hasCompleted = false;
//       let url: string | null = null;
      
//       uploadTask.on(
//         'state_changed',
//         (snapshot) => {
//           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
//           // Only emit progress up to 99% until upload is fully complete
//           this.uploadProgress.next({
//             progress: hasCompleted ? 100 : Math.min(progress, 99),
//             snapshot
//           });
//         },
//         (error) => {
//           console.error('Upload error:', error);
//           reject(error);
//         },
//         async () => {
//           try {
//             url = await getDownloadURL(uploadTask.snapshot.ref);
//             this.stagedFiles.set(userId, {
//               fileName: filename,
//               filePath: storagePath
//             });
            
//             // Mark as completed and emit 100%
//             hasCompleted = true;
//             this.uploadProgress.next({
//               progress: 100,
//               snapshot: uploadTask.snapshot
//             });
            
//             // Add delay before resolving
//             setTimeout(() => {
//               resolve(url!);
//             }, 100);
//           } catch (error) {
//             console.error('Error getting download URL:', error);
//             reject(error);
//           }
//         }
//       );
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }  

// In FirebaseService class

// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     this.validateFile(file);
//     const processedFile = file.type.startsWith('image/') ? 
//       await this.compressImage(file) : file;

//     // Generate filename
//     const timestamp = Date.now();
//     const fileName = `${timestamp}-${file.name}`;

//     // First check permanent storage
//     try {
//       const permanentRef = ref(storage, `profileImages/${userId}/${fileName}`);
//       const metadata = await getMetadata(permanentRef);
//       const existingUrl = await getDownloadURL(permanentRef);
//       console.log('File exists in permanent storage, returning existing URL');
//       return existingUrl;
//     } catch (error: any) {
//       // If file not found in permanent storage, continue with upload
//       if (error.code !== 'storage/object-not-found') {
//         throw error;
//       }
//     }

//     // File not found in permanent storage, proceed with upload to staging
//     const storagePath = `staging/profileImages/${userId}/${fileName}`;
    
//     // Track the staged file
//     this.stagedFiles.set(userId, {
//       fileName: fileName,
//       filePath: storagePath
//     });
    
//     console.log('Tracking new staged file:', {
//       userId,
//       fileName: fileName,
//       path: storagePath
//     });

//     const storageRef = ref(storage, storagePath);
//     const metadata = this.createUploadMetadata(userId, processedFile);
//     const uploadTask = uploadBytesResumable(storageRef, processedFile, metadata);

//     return new Promise((resolve, reject) => {
//       let hasCompleted = false;
      
//       uploadTask.on(
//         'state_changed',
//         (snapshot) => {
//           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//           this.uploadProgress.next({
//             progress: hasCompleted ? 100 : Math.min(progress, 99),
//             snapshot
//           });
//         },
//         (error) => {
//           console.error('Upload error:', error);
//           reject(error);
//         },
//         async () => {
//           try {
//             const url = await getDownloadURL(uploadTask.snapshot.ref);
            
//             // Mark as completed and emit 100%
//             hasCompleted = true;
//             this.uploadProgress.next({
//               progress: 100,
//               snapshot: uploadTask.snapshot
//             });
            
//             // Add delay before resolving
//             setTimeout(() => resolve(url), 100);
//           } catch (error) {
//             console.error('Error getting download URL:', error);
//             reject(error);
//           }
//         }
//       );
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }

// In FirebaseService

private async checkFileExists(userId: string, originalFileName: string): Promise<string | null> {
  try {
    // List all files in permanent storage
    const permanentRef = ref(storage, `profileImages/${userId}`);
    const result = await listAll(permanentRef);

    // Look for a file with the same name (ignoring timestamp prefix)
    for (const item of result.items) {
      // Extract original filename by removing timestamp prefix
      const existingFileName = item.name.split('-').slice(1).join('-');
      
      if (existingFileName === originalFileName) {
        console.log('Found matching file in permanent storage:', item.name);
        return await getDownloadURL(item);
      }
    }

    console.log('No matching file found, proceeding with upload');
    return null;
  } catch (error) {
    console.error('Error checking for existing file:', error);
    return null;
  }
}

async uploadFile(file: File, userId: string): Promise<string> {
  try {
    this.validateFile(file);

    // Check if file exists in permanent storage first
    const existingUrl = await this.checkFileExists(userId, file.name);
    if (existingUrl) {
      console.log('Using existing file from permanent storage');
      return existingUrl;
    }

    // No matching file found, proceed with normal upload process
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storagePath = `staging/profileImages/${userId}/${fileName}`;

    // Track the staged file
    this.stagedFiles.set(userId, {
      fileName,
      filePath: storagePath
    });

    console.log('Tracking new staged file:', {
      userId,
      fileName,
      path: storagePath
    });

    const storageRef = ref(storage, storagePath);
    const metadata = this.createUploadMetadata(userId, file);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise<string>((resolve, reject) => {
      let hasCompleted = false;
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.next({
            progress: hasCompleted ? 100 : Math.min(progress, 99),
            snapshot
          });
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            hasCompleted = true;
            this.uploadProgress.next({
              progress: 100,
              snapshot: uploadTask.snapshot
            });
            setTimeout(() => resolve(url), 100);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Helper method to generate filename hash
private generateFileHash(file: File): string {
  const str = `${file.name}-${file.size}-${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

async moveToPermStorage(userId: string, fileName: string): Promise<string> {
  try {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Authentication required');

    // Get the staged file before moving it
    const stagedFile = this.stagedFiles.get(userId);
    if (!stagedFile) {
      throw new Error('No staged file found to move');
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    const response = await firstValueFrom(
      this.http.post<{ success: boolean; path: string }>(
        `${this.baseUrl}/api/storage/move/${userId}`,
        { fileName },
        { headers }
      )
    );

    if (!response.success || !response.path) {
      throw new Error('Failed to move file to permanent storage');
    }

    // Clear staged file tracking AFTER successful move
    this.stagedFiles.delete(userId);
    console.log('Cleared staged file tracking after successful move');

    // Generate the proxied URL using the path
    const displayUrl = await this.storageService.generateImageUrl(userId, fileName);

    return displayUrl;
  } catch (error) {
    console.error('Error moving to permanent storage:', error);
    throw error;
  }
}

// private async checkFileExists(filePath: string): Promise<boolean> {
//   try {
//     const firebaseStorage = getStorage();
//     const fileRef = ref(firebaseStorage, filePath);
    
//     // Try to get metadata - this will fail if file doesn't exist
//     await getMetadata(fileRef);
//     return true;
//   } catch (error: any) {
//     if (error.code === 'storage/object-not-found') {
//       return false;
//     }
//     throw error;
//   }
// }

  // async cleanupStagedFile(userId: string): Promise<void> {
  //   if (!userId) return;
    
  //   try {
  //     await firstValueFrom(
  //       this.http.delete(
  //         `${this.baseUrl}/api/images/profile-picture/${userId}`,
  //         this.getAuthHeaders()
  //       )
  //     ).catch(async (error) => {
  //       if (error instanceof HttpErrorResponse && error.status === 401) {
  //         await this.authService.refreshToken();
  //         return firstValueFrom(
  //           this.http.delete(
  //             `${this.baseUrl}/api/images/profile-picture/${userId}`,
  //             this.getAuthHeaders()
  //           )
  //         );
  //       }
  //       throw error;
  //     });

  //     // Clear staged file tracking
  //     this.stagedFiles.delete(userId);
  //   } catch (error) {
  //     console.error('Error cleaning up staged file:', error);
  //     throw error;
  //   }
  // }

  // async cleanupStagedFile(userId: string): Promise<void> {
  //   if (!userId || !this.stagedFiles.has(userId)) return;
    
  //   try {
  //     const stagedPath = this.stagedFiles.get(userId);
  //     if (!stagedPath) return;

  //     // Get auth headers for the request
  //     const token = await this.authService.waitForToken();
  //     if (!token) throw new Error('No auth token available');

  //     const headers = new HttpHeaders()
  //     .set('Authorization', `Bearer ${token}`);
  
  //     await firstValueFrom(
  //       this.http.delete(
  //         `${this.baseUrl}/api/images/profile-picture/${userId}`,
  //         this.getAuthHeaders()
  //       ).pipe(
  //         catchError(error => {
  //           // Ignore 404 errors since they just mean the file is already gone
  //           if (error.status === 404) {
  //             return [];
  //           }
  //           // Handle auth errors
  //           if (error.status === 401) {
  //             return this.authService.refreshToken().then(() => 
  //               this.http.delete(
  //                 `${this.baseUrl}/api/images/profile-picture/${userId}`,
  //                 this.getAuthHeaders()
  //               )
  //             );
  //           }
  //           throw error;
  //         })
  //       )
  //     );
  
  //     // Clear staged file tracking
  //     this.stagedFiles.delete(userId);
  //   } catch (error) {
  //     console.error('Error cleaning up staged file:', error);
  //     // Don't throw the error - just log it and clear the tracking
  //     this.stagedFiles.delete(userId);
  //   }
  // }

  // async cleanupStagedFile(userId: string): Promise<void> {
  //   if (!userId || !this.stagedFiles.has(userId)) return;
    
  //   try {
  //     const stagedFile = this.stagedFiles.get(userId);
  //     if (!stagedFile) return;
  
  //     // Get auth headers for the request
  //     const token = await this.authService.waitForToken();
  //     if (!token) throw new Error('No auth token available');
  
  //     const headers = new HttpHeaders()
  //       .set('Authorization', `Bearer ${token}`);
  
  //     // Delete staged file
  //     await firstValueFrom(
  //       this.http.delete(
  //         `${this.baseUrl}/api/storage/cleanup/${userId}`,
  //         { headers }
  //       ).pipe(
  //         catchError(async error => {
  //           // Handle auth errors
  //           if (error.status === 401) {
  //             await this.authService.refreshToken();
  //             const newToken = await this.authService.getToken();
  //             const newHeaders = new HttpHeaders()
  //               .set('Authorization', `Bearer ${newToken}`);
              
  //             return this.http.delete(
  //               `${this.baseUrl}/api/storage/cleanup/${userId}`,
  //               { headers: newHeaders }
  //             );
  //           }
  //           // Log but don't throw for 404 errors (file already gone)
  //           if (error.status === 404) {
  //             console.log('Staged file already removed');
  //             return of(null);
  //           }
  //           throw error;
  //         })
  //       )
  //     );
  
  //     // Clear tracked staged file
  //     this.stagedFiles.delete(userId);
  //     console.log('Successfully cleaned up staged file');
      
  //   } catch (error) {
  //     console.error('Error cleaning up staged file:', error);
  //     // Still clear local tracking even if delete fails
  //     this.stagedFiles.delete(userId);
  //     throw error;
  //   }
  // }

  // firebase.service.ts

// firebase.service.ts

// async cleanupStagedFile(userId: string): Promise<void> {
//   if (!userId) {
//     console.log('No userId provided for cleanup');
//     return;
//   }

//   console.log('Starting cleanup for userId:', userId);

//   try {
//     const token = await this.authService.waitForToken();
//     if (!token) throw new Error('No auth token available');

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`);

//     console.log('Making cleanup request');

//     await firstValueFrom(
//       this.http.delete<{ success: boolean; deletedFiles: string[] }>(
//         `${this.baseUrl}/api/storage/cleanup/${userId}`,
//         { headers }
//       ).pipe(
//         tap(response => {
//           console.log('Cleanup response:', response);
//         }),
//         catchError(error => {
//           console.error('Cleanup request failed:', error);
//           throw error;
//         })
//       )
//     );

//     // Clear tracking
//     this.stagedFiles.delete(userId);
//     console.log('Cleanup completed');

//   } catch (error) {
//     console.error('Cleanup failed:', error);
//     // Still clear tracking
//     this.stagedFiles.delete(userId);
//     throw error;
//   }
// }

// imageurlmanager.service.ts

async cleanupStagedFile(userId: string): Promise<void> {
  console.log('Starting cleanup for userId:', userId);
  const stagedFile = this.stagedFiles.get(userId);
  
  if (!stagedFile) {
    console.log('No staged file found for cleanup');
    return;
  }

  try {
    console.log('Found staged file to cleanup:', stagedFile);
    
    const firebaseStorage = getStorage();
    const fileRef = ref(firebaseStorage, stagedFile.filePath);

    try {
      await deleteObject(fileRef);
      console.log('Successfully deleted staged file:', stagedFile.filePath);
    } catch (deleteError: any) {
      if (deleteError.code === 'storage/object-not-found') {
        console.log('Staged file no longer exists:', stagedFile.filePath);
      } else {
        throw deleteError;
      }
    }

  } catch (error) {
    console.error('Error deleting staged file:', error);
    throw error;
  } finally {
    this.stagedFiles.delete(userId);
    console.log('Cleared staged file tracking');
  }
}



  async deleteFile(userId: string, filePath: string): Promise<void> {
    if (!userId || !filePath) {
      throw new Error('Both userId and filePath are required to delete a file');
    }

    try {
      await this.validateUserAuthentication(userId);
      
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);

      if (filePath.startsWith('staging/')) {
        this.stagedFiles.delete(userId);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Utility Methods
  getFileName(url: string): string {
    if (!url) {
      throw new Error('URL is required');
    }

    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const match = url.match(/\/o\/(.+?)\?/);
        if (match && match[1]) {
          const fullPath = decodeURIComponent(match[1]);
          const segments = fullPath.split('/');
          return segments[segments.length - 1];
        }
      } else if (url.includes('/api/storage/')) {
        const segments = url.split('/');
        return segments[segments.length - 1];
      }

      const lastSlashIndex = url.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        return url.substring(lastSlashIndex + 1).split('?')[0];
      }

      throw new Error('Could not extract filename from URL');
    } catch (error) {
      console.error('Error extracting filename from URL:', error);
      throw new Error('Invalid URL format');
    }
  }

  async refreshAuth(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true);
        console.log('Auth refreshed for user:', {
          uid: currentUser.uid,
          provider: currentUser.providerData[0]?.providerId
        });
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      throw error;
    }
  }

  // Private Helper Methods
  private async validateUserAuthentication(userId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const currentAuthId = currentUser.uid.toString();
    const providedUserId = userId.toString();

    if (currentAuthId !== providedUserId) {
      console.log('ID mismatch:', { 
        authId: currentAuthId, 
        providedId: providedUserId,
        isGoogleUser: currentUser.providerData[0]?.providerId === 'google.com'
      });
      throw new Error('Unauthorized: User ID mismatch');
    }
  }

  private validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Allowed types: JPG, PNG, GIF, WebP');
    }
  }

  private createUploadMetadata(userId: string, file: File) {
    return {
      contentType: file.type,
      customMetadata: {
        userId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        provider: auth.currentUser?.providerData[0]?.providerId || 'unknown',
        size: file.size.toString()
      }
    };
  }
 
private async compressImage(file: File, maxWidthOrHeight = 1200, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file; // Return original file if not an image
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // If image is smaller than max dimensions, don't resize
        if (width <= maxWidthOrHeight && height <= maxWidthOrHeight) {
          resolve(file);
          return;
        }
        
        if (width > height && width > maxWidthOrHeight) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else if (height > maxWidthOrHeight) {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to original file
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              }));
            } else {
              resolve(file); // Fallback to original file
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        console.error('Error compressing image:', error);
        resolve(file); // Fallback to original file on error
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file
    };
    
    img.src = objectUrl;
  });
}  

  // Helper Methods for URL Types
  private isFirebaseStorageUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
  }

  private isProxiedUrl(url: string): boolean {
    return url.includes('/api/storage/');
  }

  // Cleanup Method
  async cleanup(userId: string): Promise<void> {
    try {
      const stagedPath = this.getStagedFilePath(userId);
      if (stagedPath) {
        await this.deleteFile(userId, stagedPath);
      }
      this.stagedFiles.delete(userId);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}