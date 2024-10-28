// import { Injectable } from '@angular/core';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// import { storage, auth } from '../firebase.config';
// import { firstValueFrom, from, Observable } from 'rxjs';
// import { HttpClient, HttpHeaders } from '@angular/common/http';

// @Injectable({
//   providedIn: 'root'
// })
// export class FirebaseService {
//     constructor(private http: HttpClient) {}


// async uploadFile(file: File, userId: string, folder: string = 'profileImages'): Promise<string> {
//     if (!auth.currentUser) {
//       throw new Error('User not authenticated');
//     }

//     try {
//       // For Google OAuth users, the ID might be numeric
//       const currentAuthId = auth.currentUser.uid.toString();
//       const providedUserId = userId.toString();

//       if (currentAuthId !== providedUserId) {
//         console.log('ID mismatch:', { 
//           authId: currentAuthId, 
//           providedId: providedUserId,
//           isGoogleUser: auth.currentUser.providerData[0]?.providerId === 'google.com'
//         });
//         throw new Error('Unauthorized: User ID mismatch');
//       }

//       // Get the token from your storage
//       const token = localStorage.getItem('token'); // or however you store your JWT token
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       // Set up headers with Authorization token
//       const headers = new HttpHeaders({
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       });

//       // Get signed URL from backend
//       const response = await this.http.post(`/api/images/upload-url/${userId}`, {
//         contentType: file.type,
//         folder: folder
//       }, { headers }).toPromise();

//       if (!response) {
//         throw new Error('Failed to get upload URL');
//       }

//       const { uploadUrl, fileName, fullPath } = response as any;

//       // Compress and upload file
//       const compressedFile = await this.compressImage(file);
//       const storageRef = ref(storage, fullPath);

//       const metadata = {
//         contentType: file.type,
//         customMetadata: {
//           userId: providedUserId,
//           originalName: file.name,
//           uploadedAt: new Date().toISOString(),
//           provider: auth.currentUser.providerData[0]?.providerId || 'unknown'
//         }
//       };

//       const uploadTask = uploadBytesResumable(storageRef, compressedFile, metadata);

//       return new Promise((resolve, reject) => {
//         uploadTask.on(
//           'state_changed',
//           (snapshot) => {
//             const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//             console.log('Upload is ' + progress + '% done');
//           },
//           (error) => {
//             console.error('Upload error:', {
//               code: error.code,
//               message: error.message,
//               authId: currentAuthId,
//               providedId: providedUserId
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
//       console.error('Error in uploadFile:', error);
//       throw error;
//     }
// }


//   private compressImage(file: File, maxWidthOrHeight = 1200, quality = 0.8): Promise<File> {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       const objectUrl = URL.createObjectURL(file);
      
//       img.onerror = () => {
//         URL.revokeObjectURL(objectUrl);
//         reject(new Error('Failed to load image'));
//       };
      
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
        
//         // Preserve original mime type if it's valid
//         const outputType = file.type.match('image/(jpeg|png|gif|webp)') ? file.type : 'image/jpeg';
        
//         canvas.toBlob(
//           (blob) => {
//             if (blob) {
//               const extension = outputType.split('/')[1];
//               const fileName = `${file.name.split('.')[0]}.${extension}`;
              
//               resolve(new File([blob], fileName, {
//                 type: outputType,
//                 lastModified: Date.now()
//               }));
//             } else {
//               reject(new Error('Failed to compress image'));
//             }
//           },
//           outputType,
//           quality
//         );
//       };
      
//       img.src = objectUrl;
//     });
//   }

//   async refreshAuth(): Promise<void> {
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

// }  

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { storage, auth } from '../firebase.config';
import { ref, uploadBytesResumable, getDownloadURL, StorageReference, UploadTaskSnapshot } from 'firebase/storage';

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

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private http: HttpClient) {}

//   async uploadFile(file: File, userId: string, folder: string = 'profileImages'): Promise<string> {
//     try {
//       await this.validateUserAuthentication(userId);
      
//       const token = await this.getAuthToken();
//       const uploadResponse = await this.getUploadUrl(userId, file.type, folder, token);
//       const compressedFile = await this.compressImage(file);
//       const downloadUrl = await this.uploadToFirebase(
//         compressedFile, 
//         uploadResponse.fullPath, 
//         userId, 
//         file
//       );
      
//       return downloadUrl;
//     } catch (error) {
//       console.error('Error in uploadFile:', error);
//       throw this.handleUploadError(error);
//     }
//   }

async uploadFile(file: File, userId: string, folder: string = 'profileImages'): Promise<string> {
    try {
      await this.validateUserAuthentication(userId);
      
      // Generate unique file name
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      // Create the full storage path
      const storagePath = `${folder}/${userId}/${uniqueFileName}`;
      
      const token = await this.getAuthToken();
      const compressedFile = await this.compressImage(file);
      const downloadUrl = await this.uploadToFirebase(
        compressedFile, 
        storagePath, 
        userId, 
        file
      );
      
      return downloadUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw this.handleUploadError(error);
    }
  }

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

  private async getAuthToken(): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  private async getUploadUrl(
    userId: string, 
    contentType: string, 
    folder: string, 
    token: string
  ): Promise<UploadResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    try {
      const response = await firstValueFrom(
        this.http.post<UploadResponse>(`/api/images/upload-url/${userId}`, {
          contentType,
          folder
        }, { headers })
      );

      if (!response) {
        throw new Error('Failed to get upload URL');
      }

      return response;
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw new Error('Failed to get upload URL');
    }
  }

//   private async uploadToFirebase(
//     file: File, 
//     fullPath: string, 
//     userId: string, 
//     originalFile: File
//   ): Promise<string> {
//     const storageRef = ref(storage, fullPath);
//     const metadata = this.createUploadMetadata(userId, originalFile);
//     const uploadTask = uploadBytesResumable(storageRef, file, metadata);

//     return new Promise((resolve, reject) => {
//       uploadTask.on(
//         'state_changed',
//         (snapshot) => this.handleUploadProgress(snapshot),
//         (error) => this.handleUploadError(error, reject),
//         async () => {
//           try {
//             const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
//             console.log('Upload successful, URL:', downloadURL);
//             resolve(downloadURL);
//           } catch (error) {
//             console.error('Error getting download URL:', error);
//             reject(error);
//           }
//         }
//       );
//     });
//   }

private async uploadToFirebase(
    file: File, 
    storagePath: string, 
    userId: string, 
    originalFile: File
  ): Promise<string> {
    try {
      // Create a reference with the full path
      const storageRef = ref(storage, storagePath);
      
      // Create metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId,
          originalName: originalFile.name,
          uploadedAt: new Date().toISOString(),
          provider: auth.currentUser?.providerData[0]?.providerId || 'unknown'
        }
      };

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
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
              console.log('Upload successful, URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadToFirebase:', error);
      throw error;
    }
  }

  private createUploadMetadata(userId: string, file: File) {
    return {
      contentType: file.type,
      customMetadata: {
        userId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        provider: auth.currentUser?.providerData[0]?.providerId || 'unknown'
      }
    };
  }

  private handleUploadProgress(snapshot: UploadTaskSnapshot) {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
  }

  private handleUploadError(error: any, reject?: (error: any) => void): Error {
    const errorMessage = error?.message || 'Upload failed';
    console.error('Upload error:', {
      code: error?.code,
      message: errorMessage,
      details: error
    });

    const finalError = new Error(errorMessage);
    if (reject) {
      reject(finalError);
    }
    return finalError;
  }

  private async compressImage(file: File, maxWidthOrHeight = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
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
          reject(new Error('Failed to get canvas context'));
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
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  }

  getCurrentUser() {
    return auth.currentUser;
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

}