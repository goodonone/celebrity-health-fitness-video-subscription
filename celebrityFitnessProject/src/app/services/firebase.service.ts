// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// import { firstValueFrom, Observable, Subject } from 'rxjs';
// import { storage, auth } from '../firebase.config';
// import { ref, uploadBytesResumable, getDownloadURL, StorageReference, UploadTaskSnapshot, deleteObject, getStorage } from 'firebase/storage';
// import { environment } from 'src/environments/environment';
// import { AuthService } from './auth.service';

// interface UploadResponse {
//   uploadUrl: string;
//   fileName: string;
//   fullPath: string;
//   downloadUrl: string;
// }

// interface UploadProgress {
//   progress: number;
//   snapshot: UploadTaskSnapshot;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class FirebaseService {
//   private uploadProgress = new Subject<UploadProgress>();
//   private stagedFiles: Map<string, string> = new Map();

//   private readonly baseUrl = environment.apiUrl;

//   constructor(private http: HttpClient, private authService: AuthService) {}

//   getUploadProgress(): Observable<UploadProgress> {
//     return this.uploadProgress.asObservable();
//   }

//   // private getAuthHeaders(): { headers: HttpHeaders } {
//   //   const token = this.authService.getToken();
//   //   if (!token) {
//   //     throw new Error('No auth token available');
//   //   }
//   //   return {
//   //     headers: new HttpHeaders()
//   //       .set('Authorization', `Bearer ${token}`)
//   //   };
//   // }
 
//   // private async getAuthHeaders(): Promise<{ headers: HttpHeaders }> {
//   //   const token = await this.authService.waitForToken();
//   //   if (!token) {
//   //     throw new Error('No auth token available');
//   //   }
//   //   return {
//   //     headers: new HttpHeaders()
//   //       .set('Authorization', `Bearer ${token}`)
//   //       .set('Content-Type', 'application/json')
//   //   };
//   // }  
 
//   private getAuthHeaders() {
//     const token = this.authService.getToken();
//     if (!token) {
//       throw new Error('No auth token available');
//     }
//     return {
//       headers: new HttpHeaders()
//         .set('Authorization', `Bearer ${token}`)
//     };
//   }
  
//   // For cases where you need content-type:
//   private getAuthHeadersWithContentType() {
//     const token = this.authService.getToken();
//     if (!token) {
//       throw new Error('No auth token available');
//     }
//     return {
//       headers: new HttpHeaders()
//         .set('Authorization', `Bearer ${token}`)
//         .set('Content-Type', 'application/json')
//     };
//   }

// private async getAuthHeadersAsync(): Promise<{ headers: HttpHeaders }> {
//   const token = await this.authService.waitForToken();
//   if (!token) {
//     throw new Error('No auth token available');
//   }
//   return {
//     headers: new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`)
//       .set('Content-Type', 'application/json')
//   };
// }

// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     const storage = getStorage();
//     const timestamp = Date.now();
//     const filename = `${timestamp}-${file.name}`;
//     const storagePath = `staging/profileImages/${userId}/${filename}`;
//     const storageRef = ref(storage, storagePath);
    
//     const uploadTask = uploadBytesResumable(storageRef, file);
    
//     await new Promise<void>((resolve, reject) => {
//       uploadTask.on(
//         'state_changed',
//         null,
//         (error) => reject(error),
//         () => resolve()
//       );
//     });

//     const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
//     return downloadURL;
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }


// // async cleanupStagedFile(userId: string): Promise<void> {
// //     if (!userId) return;
    
// //     try {
// //       await firstValueFrom(
// //         this.http.delete(
// //           `${this.baseUrl}/api/images/profile-picture/${userId}`,
// //           this.getAuthHeaders() 
// //         )
// //       );
// //     } catch (error) {
// //       console.error('Error cleaning up staged file:', error);
// //     }
// //   }

// // async cleanupStagedFile(userId: string): Promise<void> {
// //   if (!userId) return;
  
// //   try {
// //     await firstValueFrom(
// //       this.http.delete(
// //         `${this.baseUrl}/api/images/profile-picture/${userId}`,
// //         this.getAuthHeaders()  // Use synchronous version
// //       )
// //     );
// //   } catch (error) {
// //     if (error instanceof HttpErrorResponse && error.status === 401) {
// //       // Token expired, try to refresh and retry
// //       try {
// //         await this.authService.refreshToken();
// //         await firstValueFrom(
// //           this.http.delete(
// //             `${this.baseUrl}/api/images/profile-picture/${userId}`,
// //             this.getAuthHeaders()
// //           )
// //         );
// //       } catch (retryError) {
// //         console.error('Error after token refresh:', retryError);
// //         throw retryError;
// //       }
// //     } else {
// //       console.error('Error cleaning up staged file:', error);
// //       throw error;
// //     }
// //   }
// // }

// async cleanupStagedFile(userId: string): Promise<void> {
//   if (!userId) return;
  
//   try {
//     await firstValueFrom(
//       this.http.delete(
//         `${this.baseUrl}/api/images/profile-picture/${userId}`,
//         this.getAuthHeaders()
//       )
//     );
//   } catch (error) {
//     if (error instanceof HttpErrorResponse && error.status === 401) {
//       try {
//         await this.authService.refreshToken();
//         await firstValueFrom(
//           this.http.delete(
//             `${this.baseUrl}/api/images/profile-picture/${userId}`,
//             this.getAuthHeaders()
//           )
//         );
//       } catch (retryError) {
//         console.error('Error after token refresh:', retryError);
//         throw retryError;
//       }
//     } else {
//       console.error('Error cleaning up staged file:', error);
//       throw error;
//     }
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const token = await this.authService.getToken();
//     if (!token) {
//       throw new Error('No authentication token available');
//     }

//     // Match the exact route from your backend
//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${environment.apiUrl}/api/storage/move/${userId}`, // Matches backend route
//         { fileName },
//         {
//           headers: new HttpHeaders()
//             .set('Authorization', `Bearer ${token}`)
//             .set('Content-Type', 'application/json')
//         }
//       )
//     );

//     if (!response.success) {
//       throw new Error(response.message || 'Failed to move file');
//     }

//     return response.url;
//   } catch (error) {
//     console.error('Error moving to permanent storage:', error);
//     throw error;
//   }
// }

// // firebase.service.ts
// getFileName(url: string): string {
//   if (!url) {
//     throw new Error('URL is required');
//   }

//   try {
//     // Handle both Firebase Storage URLs and proxied URLs
//     if (url.includes('firebasestorage.googleapis.com')) {
//       // For Firebase Storage URLs
//       // Extract the path after /o/ and before ?
//       const match = url.match(/\/o\/(.+?)\?/);
//       if (match && match[1]) {
//         // URL decode the path and get the last segment
//         const fullPath = decodeURIComponent(match[1]);
//         const segments = fullPath.split('/');
//         return segments[segments.length - 1];
//       }
//     } else if (url.includes('/api/storage/')) {
//       // For proxied URLs
//       // Split on the last forward slash to get the filename
//       const segments = url.split('/');
//       return segments[segments.length - 1];
//     }

//     // If URL format is not recognized, extract anything after the last slash
//     const lastSlashIndex = url.lastIndexOf('/');
//     if (lastSlashIndex !== -1) {
//       // Remove any query parameters
//       const fileName = url.substring(lastSlashIndex + 1).split('?')[0];
//       return fileName;
//     }

//     throw new Error('Could not extract filename from URL');
//   } catch (error) {
//     console.error('Error extracting filename from URL:', error);
//     throw new Error('Invalid URL format');
//   }
// }

// // Helper method to check if URL is a Firebase Storage URL
// private isFirebaseStorageUrl(url: string): boolean {
//   return url.includes('firebasestorage.googleapis.com');
// }

// // Helper method to check if URL is a proxied URL
// private isProxiedUrl(url: string): boolean {
//   return url.includes('/api/storage/');
// }

//   hasStagedFile(userId: string): boolean {
//     return this.stagedFiles.has(userId);
//   }

//   // Add method to get staged file path
//   getStagedFilePath(userId: string): string | null {
//     return this.stagedFiles.get(userId) || null;
//   }

//   private async validateUserAuthentication(userId: string): Promise<void> {
//     const currentUser = auth.currentUser;
//     if (!currentUser) {
//       throw new Error('User not authenticated');
//     }

//     const currentAuthId = currentUser.uid.toString();
//     const providedUserId = userId.toString();

//     if (currentAuthId !== providedUserId) {
//       console.log('ID mismatch:', { 
//         authId: currentAuthId, 
//         providedId: providedUserId,
//         isGoogleUser: currentUser.providerData[0]?.providerId === 'google.com'
//       });
//       throw new Error('Unauthorized: User ID mismatch');
//     }
//   }

//   private async getAuthToken(): Promise<string> {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       throw new Error('No authentication token found');
//     }
//     return token;
//   }

//   private async getUploadUrl(
//     userId: string, 
//     contentType: string, 
//     folder: string, 
//     token: string
//   ): Promise<UploadResponse> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     });

//     try {
//       const response = await firstValueFrom(
//         this.http.post<UploadResponse>(`/api/upload-url/${userId}`, {
//           contentType,
//           folder
//         }, { headers })
//       );

//       if (!response) {
//         throw new Error('Failed to get upload URL');
//       }

//       return response;
//     } catch (error) {
//       console.error('Error getting upload URL:', error);
//       throw new Error('Failed to get upload URL');
//     }
//   }

// private async uploadToFirebase(
//     file: File, 
//     storagePath: string, 
//     userId: string, 
//     originalFile: File
//   ): Promise<string> {
//     try {
//       // Create a reference with the full path
//       const storageRef = ref(storage, storagePath);
      
//       // Create metadata
//       const metadata = {
//         contentType: file.type,
//         customMetadata: {
//           userId,
//           originalName: originalFile.name,
//           uploadedAt: new Date().toISOString(),
//           provider: auth.currentUser?.providerData[0]?.providerId || 'unknown',
//           size: file.size.toString()
//         }
//       };

//       // Start upload
//       const uploadTask = uploadBytesResumable(storageRef, file, metadata);

//       return new Promise((resolve, reject) => {
//         uploadTask.on(
//           'state_changed',
//           (snapshot) => {
//             const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//             console.log('Upload is ' + progress + '% done');
//             this.uploadProgress.next({
//               progress: Math.round(progress),
//               snapshot
//             });
//           },
//           (error) => {
//             console.error('Upload error:', {
//               code: error.code,
//               message: error.message,
//               path: storagePath
//             });
//             reject(error);
//           },
//           async () => {
//             try {
//               const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
//               console.log('Upload successful, URL:', downloadURL);
//               resolve(downloadURL);
//             } catch (error) {
//               console.error('Error getting download URL:', error);
//               reject(error);
//             }
//           }
//         );
//       });
//     } catch (error) {
//       console.error('Error in uploadToFirebase:', error);
//       throw error;
//     }
//   }

//   private createUploadMetadata(userId: string, file: File) {
//     return {
//       contentType: file.type,
//       customMetadata: {
//         userId,
//         originalName: file.name,
//         uploadedAt: new Date().toISOString(),
//         provider: auth.currentUser?.providerData[0]?.providerId || 'unknown'
//       }
//     };
//   }

//   private handleUploadProgress(snapshot: UploadTaskSnapshot) {
//     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//     console.log('Upload is ' + progress + '% done');
//   }

//   private handleUploadError(error: any, reject?: (error: any) => void): Error {
//     const errorMessage = error?.message || 'Upload failed';
//     console.error('Upload error:', {
//       code: error?.code,
//       message: errorMessage,
//       details: error
//     });

//     const finalError = new Error(errorMessage);
//     if (reject) {
//       reject(finalError);
//     }
//     return finalError;
//   }

//   private async compressImage(file: File, maxWidthOrHeight = 1200, quality = 0.8): Promise<File> {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       const objectUrl = URL.createObjectURL(file);
      
//       img.onload = () => {
//         URL.revokeObjectURL(objectUrl);
//         const canvas = document.createElement('canvas');
//         let width = img.width;
//         let height = img.height;
        
//         if (width > height && width > maxWidthOrHeight) {
//           height = Math.round((height * maxWidthOrHeight) / width);
//           width = maxWidthOrHeight;
//         } else if (height > maxWidthOrHeight) {
//           width = Math.round((width * maxWidthOrHeight) / height);
//           height = maxWidthOrHeight;
//         }
        
//         canvas.width = width;
//         canvas.height = height;
        
//         const ctx = canvas.getContext('2d');
//         if (!ctx) {
//           reject(new Error('Failed to get canvas context'));
//           return;
//         }

//         ctx.drawImage(img, 0, 0, width, height);
        
//         canvas.toBlob(
//           (blob) => {
//             if (blob) {
//               resolve(new File([blob], file.name, {
//                 type: file.type,
//                 lastModified: Date.now()
//               }));
//             } else {
//               reject(new Error('Failed to compress image'));
//             }
//           },
//           file.type,
//           quality
//         );
//       };
      
//       img.onerror = () => {
//         URL.revokeObjectURL(objectUrl);
//         reject(new Error('Failed to load image'));
//       };
      
//       img.src = objectUrl;
//     });
//   }

//   getCurrentUser() {
//     return auth.currentUser;
//   }

//     async refreshAuth(): Promise<void> {
//     try {
//       const currentUser = auth.currentUser;
//       if (currentUser) {
//         await currentUser.getIdToken(true);
//         console.log('Auth refreshed for user:', {
//           uid: currentUser.uid,
//           provider: currentUser.providerData[0]?.providerId
//         });
//       }
//     } catch (error) {
//       console.error('Error refreshing auth:', error);
//       throw error;
//     }
// }

// async deleteFile(userId: string, filePath: string): Promise<void> {
//   if (!userId || !filePath) {
//     throw new Error('Both userId and filePath are required to delete a file');
//   }

//   try {
//     await this.validateUserAuthentication(userId);
    
//     const fileRef = ref(storage, filePath);
//     await deleteObject(fileRef);

//     // If this was a staged file, remove from tracking
//     if (filePath.startsWith('staging/')) {
//       this.stagedFiles.delete(userId);
//     }
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     throw error;
//   }
// }

// }






import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, firstValueFrom, from, Observable, Subject, switchMap, throwError } from 'rxjs';
import { storage, auth } from '../firebase.config';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  StorageReference, 
  UploadTaskSnapshot, 
  deleteObject, 
  getStorage 
} from 'firebase/storage';
import { environment } from 'src/environments/environment';
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
  private stagedFiles: Map<string, string> = new Map();

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
    return this.stagedFiles.has(userId);
  }

  getStagedFilePath(userId: string): string | null {
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

  // File Upload Methods
  async uploadFile(file: File, userId: string): Promise<string> {
    try {
      // Validate file
      this.validateFile(file);

      // Compress image if needed
      const processedFile = file.type.startsWith('image/') ? 
        await this.compressImage(file) : file;

      const storage = getStorage();
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const storagePath = `staging/profileImages/${userId}/${filename}`;
      const storageRef = ref(storage, storagePath);
      
      const metadata = this.createUploadMetadata(userId, processedFile);
      const uploadTask = uploadBytesResumable(storageRef, processedFile, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.uploadProgress.next({
              progress: Math.round(progress),
              snapshot
            });
          },
          (error) => {
            console.error('Upload error:', {
              code: error.code,
              message: error.message,
              path: storagePath
            });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              this.stagedFiles.set(userId, storagePath);
              resolve(downloadURL);
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

  // async moveToPermStorage(userId: string, fileName: string): Promise<string> {
  //   try {
  //     const response = await firstValueFrom(
  //       this.http.post<{ success: boolean; url: string }>(
  //         `${this.baseUrl}/api/storage/move/${userId}`,
  //         { fileName },
  //         this.getAuthHeadersWithContentType()
  //       )
  //     ).catch(async (error) => {
  //       if (error instanceof HttpErrorResponse && error.status === 401) {
  //         await this.authService.refreshToken();
  //         return firstValueFrom(
  //           this.http.post<{ success: boolean; url: string }>(
  //             `${this.baseUrl}/api/storage/move/${userId}`,
  //             { fileName },
  //             this.getAuthHeadersWithContentType()
  //           )
  //         );
  //       }
  //       throw error;
  //     });

  //     if (!response.success || !response.url) {
  //       throw new Error('Failed to move file to permanent storage');
  //     }

  //     // Clear staged file tracking
  //     this.stagedFiles.delete(userId);
      
  //     return response.url;
  //   } catch (error) {
  //     console.error('Error moving to permanent storage:', error);
  //     throw error;
  //   }
  // }

  // async moveToPermStorage(userId: string, fileName: string): Promise<string> {
  //   try {
  //     if (!fileName) {
  //       throw new Error('Filename is required');
  //     }
  
  //     const response = await firstValueFrom(
  //       this.http.post<{ success: boolean; url: string }>(
  //         `${this.baseUrl}/api/storage/move/${userId}`,
  //         { fileName },
  //         this.getAuthHeadersWithContentType()
  //       ).pipe(
  //         catchError(async (error) => {
  //           if (error.status === 401) {
  //             await this.authService.refreshToken();
  //             return this.http.post<{ success: boolean; url: string }>(
  //               `${this.baseUrl}/api/storage/move/${userId}`,
  //               { fileName },
  //               this.getAuthHeadersWithContentType()
  //             );
  //           }
  //           throw error;
  //         })
  //       )
  //     );
  
  //     if (!response || !response.success || !response.url) {
  //       throw new Error('Failed to move file to permanent storage');
  //     }
  
  //     return response.url;
  //   } catch (error) {
  //     console.error('Error moving to permanent storage:', error);
  //     throw error;
  //   }
  // }  

  // async moveToPermStorage(userId: string, fileName: string): Promise<string> {
  //   try {
  //     if (!fileName) {
  //       throw new Error('Filename is required');
  //     }
  
  //     const response = await firstValueFrom(
  //       this.http.post<{ success: boolean; url: string }>(
  //         `${this.baseUrl}/api/storage/move/${userId}`,
  //         { fileName },
  //         this.getAuthHeadersWithContentType()
  //       ).pipe(
  //         catchError(async (error) => {
  //           if (error.status === 401) {
  //             await this.authService.refreshToken();
  //             return this.http.post<{ success: boolean; url: string }>(
  //               `${this.baseUrl}/api/storage/move/${userId}`,
  //               { fileName },
  //               this.getAuthHeadersWithContentType()
  //             );
  //           }
  //           throw error;
  //         })
  //       )
  //     );
  
  //     if (!response || !response.success || !response.url) {
  //       throw new Error('Failed to move file to permanent storage');
  //     }
  
  //     // Clear staged file tracking after successful move
  //     this.stagedFiles.delete(userId);
  
  //     return response.url;
  //   } catch (error) {
  //     console.error('Error moving to permanent storage:', error);
  //     throw error;
  //   }
  // }  
  
// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//     try {
//       if (!fileName) {
//         throw new Error('Filename is required');
//       }
  
//       const response = await firstValueFrom(
//         this.http.post<{ success: boolean; url: string }>(
//           `${this.baseUrl}/api/storage/move/${userId}`,
//           { fileName },
//           this.getAuthHeadersWithContentType()
//         ).pipe(
//           catchError((error) => {
//             if (error.status === 401) {
//               return from(this.authService.refreshToken()).pipe(
//                 switchMap(() =>
//                   this.http.post<{ success: boolean; url: string }>(
//                     `${this.baseUrl}/api/storage/move/${userId}`,
//                     { fileName },
//                     this.getAuthHeadersWithContentType()
//                   )
//                 )
//               );
//             }
//             return throwError(() => error);
//           })
//         )
//       );
  
//       if (!response || !response.success || !response.url) {
//         throw new Error('Failed to move file to permanent storage');
//       }
  
//       // Clear staged file tracking after successful move
//       this.stagedFiles.delete(userId);
  
//       return response.url;
//     } catch (error) {
//       console.error('Error moving to permanent storage:', error);
//       throw error;
//     }
//   }  

async moveToPermStorage(userId: string, fileName: string): Promise<string> {
  try {
    const token = await this.authService.getToken();
    if (!token) throw new Error('Authentication required');

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

    // Generate the proxied URL using the path
    const displayUrl = await this.storageService.generateImageUrl(userId, fileName);

    return displayUrl;
  } catch (error) {
    console.error('Error moving to permanent storage:', error);
    throw error;
  }
}

  async cleanupStagedFile(userId: string): Promise<void> {
    if (!userId) return;
    
    try {
      await firstValueFrom(
        this.http.delete(
          `${this.baseUrl}/api/images/profile-picture/${userId}`,
          this.getAuthHeaders()
        )
      ).catch(async (error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          await this.authService.refreshToken();
          return firstValueFrom(
            this.http.delete(
              `${this.baseUrl}/api/images/profile-picture/${userId}`,
              this.getAuthHeaders()
            )
          );
        }
        throw error;
      });

      // Clear staged file tracking
      this.stagedFiles.delete(userId);
    } catch (error) {
      console.error('Error cleaning up staged file:', error);
      throw error;
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

  // private async compressImage(file: File, maxWidthOrHeight = 1200, quality = 0.8): Promise<File> {
  //   return new Promise((resolve, reject) => {
  //     const img = new Image();
  //     const objectUrl = URL.createObjectURL(file);
      
  //     img.onload = () => {
  //       URL.revokeObjectURL(objectUrl);
  //       const canvas = document.createElement('canvas');
  //       let width = img.width;
  //       let height = img.height;
        
  //       if (width > height && width > maxWidthOrHeight) {
  //         height = Math.round((height * maxWidthOrHeight) / width);
  //         width = maxWidthOrHeight;
  //       } else if (height > maxWidthOrHeight) {
  //         width = Math.round((width * maxWidthOrHeight) / height);
  //         height = maxWidthOrHeight;
  //       }
        
  //       canvas.width = width;
  //       canvas.height = height;
        
  //       const ctx = canvas.getContext('2d');
  //       if (!ctx) {
  //         reject(new Error('Failed to get canvas context'));
  //         return;
  //       }

  //       ctx.drawImage(img, 0, 0, width, height);
        
  //       canvas.toBlob(
  //         (blob) => {
  //           if (blob) {
  //             resolve(new File([blob], file.name, {
  //               type: file.type,
  //               lastModified: Date.now()
  //             }));
  //           } else {
  //             reject(new Error('Failed to compress image'));
  //           }
  //         },
  //         file.type,
  //         quality
  //       );
  //     };
      
  //     img.onerror = () => {
  //       URL.revokeObjectURL(objectUrl);
  //       reject(new Error('Failed to load image'));
  //     };
      
  //     img.src = objectUrl;
  //   });
  // }
 
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