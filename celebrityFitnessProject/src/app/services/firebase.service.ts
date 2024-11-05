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

// async uploadFile(file: File, userId: string, folder: string = 'profileImages', isStaged: boolean = true): Promise<string> {
//     try {
//       await this.validateUserAuthentication(userId);
      
//       // Generate unique file name
//       const timestamp = Date.now();
//       const fileExtension = file.name.split('.').pop();
//       const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
//       // Create the full storage path
//       const storagePath = isStaged ?
//       `staging/${folder}/${userId}/${uniqueFileName}` :
//       `${folder}/${userId}/${uniqueFileName}`;
      
//       const token = await this.getAuthToken();
//       const compressedFile = await this.compressImage(file);
//       const downloadUrl = await this.uploadToFirebase(
//         compressedFile, 
//         storagePath, 
//         userId, 
//         file
//       );

//       // Track staged file if applicable
//       if (isStaged) {
//         // Remove any existing staged file first
//         await this.cleanupStagedFile(userId);
//         this.stagedFiles.set(userId, storagePath);
//       }
      
//       return downloadUrl;
//     } catch (error) {
//       console.error('Error in uploadFile:', error);
//       throw this.handleUploadError(error);
//     }
//   }

// async uploadFile(file: File, userId: string, folder: string = 'profileImages', isStaged: boolean = true): Promise<string> {
//   try {
//     await this.validateUserAuthentication(userId);
    
//     // Generate unique file name
//     const timestamp = Date.now();
//     const fileExtension = file.name.split('.').pop();
//     const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
//     // Create the full storage path
//     const storagePath = isStaged ?
//       `staging/${folder}/${userId}/${uniqueFileName}` :
//       `${folder}/${userId}/${uniqueFileName}`;

//     // Start upload
//     const storageRef = ref(storage, storagePath);
    
//     const metadata = {
//       contentType: file.type,
//       customMetadata: {
//         userId,
//         originalName: file.name,
//         uploadedAt: new Date().toISOString()
//       }
//     };

//     const uploadTask = uploadBytesResumable(storageRef, file, metadata);

//     const downloadURL = await new Promise<string>((resolve, reject) => {
//       uploadTask.on(
//         'state_changed',
//         (snapshot) => {
//           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//           this.uploadProgress.next({
//             progress: Math.round(progress),
//             snapshot
//           });
//         },
//         reject,
//         async () => {
//           try {
//             const url = await getDownloadURL(uploadTask.snapshot.ref);
//             resolve(url);
//           } catch (error) {
//             reject(error);
//           }
//         }
//       );
//     });

//     // Track staged file
//     if (isStaged) {
//       await this.cleanupStagedFile(userId);
//       this.stagedFiles.set(userId, storagePath);
//     }

//     return downloadURL;
//   } catch (error) {
//     console.error('Error in uploadFile:', error);
//     throw error;
//   }
// }

// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     const formData = new FormData();
//     formData.append('file', file);
    
//     // Use backend proxy to handle the upload
//     const response = await firstValueFrom(
//       this.http.post<any>(`${this.baseUrl}/api/images/upload-url/${userId}`, {
//         contentType: file.type,
//         folder: 'staging/profileImages'
//       })
//     );

//     if (!response.success) {
//       throw new Error('Failed to upload file');
//     }

//     return response.data.downloadUrl;
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }
  // async cleanupStagedFile(userId: string): Promise<void> {
  //   const stagedPath = this.stagedFiles.get(userId);
  //   if (stagedPath) {
  //     try {
  //       const fileRef = ref(storage, stagedPath);
  //       await deleteObject(fileRef);
  //       this.stagedFiles.delete(userId);
  //       console.log('Cleaned up staged file:', stagedPath);
  //     } catch (error) {
  //       console.error('Error cleaning up staged file:', error);
  //       // Don't throw error as this is cleanup
  //     }
  //   }
  // }

  // async cleanupStagedFile(userId: string): Promise<void> {
  //   if (!userId) return;
    
  //   try {
  //     await firstValueFrom(
  //       this.http.delete(`${this.baseUrl}/api/images/profile-picture/${userId}`)
  //     );
  //   } catch (error) {
  //     console.error('Error cleaning up staged file:', error);
  //   }
  // }


  // async moveToPermStorage(userId: string): Promise<string | null> {
  //   const stagedPath = this.stagedFiles.get(userId);
  //   if (!stagedPath) {
  //     console.log('No staged file found for user:', userId);
  //     return null;
  //   }

  //   try {
  //     // Get the file name from the staged path
  //     const fileName = stagedPath.split('/').pop();
  //     if (!fileName) throw new Error('Invalid staged path');

  //     // Create permanent path
  //     const permPath = `profileImages/${userId}/${fileName}`;
      
  //     // Get download URL of staged file
  //     const stagedRef = ref(storage, stagedPath);
  //     const stagedUrl = await getDownloadURL(stagedRef);

  //     // Download staged file
  //     const response = await fetch(stagedUrl);
  //     const blob = await response.blob();

  //     // Upload to permanent location
  //     const permRef = ref(storage, permPath);
  //     const uploadTask = uploadBytesResumable(permRef, blob);

  //     const downloadUrl = await new Promise<string>((resolve, reject) => {
  //       uploadTask.on(
  //         'state_changed',
  //         (snapshot) => {
  //           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  //           this.uploadProgress.next({
  //             progress: Math.round(progress),
  //             snapshot
  //           });
  //         },
  //         reject,
  //         async () => {
  //           try {
  //             const url = await getDownloadURL(uploadTask.snapshot.ref);
  //             resolve(url);
  //           } catch (error) {
  //             reject(error);
  //           }
  //         }
  //       );
  //     });

  //     // Cleanup staged file
  //     await this.cleanupStagedFile(userId);

  //     return downloadUrl;
  //   } catch (error) {
  //     console.error('Error moving file to permanent storage:', error);
  //     throw error;
  //   }
  // }
// firebase.service.ts
// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     // Instead of fetching, use the Firebase Admin SDK's copy operation
//     const bucket = storage.bucket();
//     const stagingPath = `staging/profileImages/${userId}/${fileName}`;
//     const permanentPath = `profileImages/${userId}/${fileName}`;
    
//     // Get reference to both files
//     const stagingFile = bucket.file(stagingPath);
//     const permanentFile = bucket.file(permanentPath);

//     // Check if staged file exists
//     const [exists] = await stagingFile.exists();
//     if (!exists) {
//       throw new Error('Staged file not found');
//     }

//     // Copy to permanent location
//     await stagingFile.copy(permanentFile);
    
//     // Delete staged file
//     await stagingFile.delete();

//     // Get the download URL
//     const [signedUrl] = await permanentFile.getSignedUrl({
//       action: 'read',
//       expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
//     });

//     console.log('Image moved successfully:', {
//       from: stagingPath,
//       to: permanentPath,
//       url: signedUrl
//     });

//     return signedUrl;
    
//   } catch (error) {
//     console.error('Error moving file to permanent storage:', error);
//     throw error;
//   }
// }

// // Add method to get signed URL for a file
// async getSignedUrl(filePath: string): Promise<string> {
//   try {
//     const file = storage.bucket().file(filePath);
//     const [exists] = await file.exists();
    
//     if (!exists) {
//       throw new Error('File not found');
//     }

//     const [url] = await file.getSignedUrl({
//       action: 'read',
//       expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
//     });

//     return url;
//   } catch (error) {
//     console.error('Error getting signed URL:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const stagingPath = `staging/profileImages/${userId}/${fileName}`;
//     const permanentPath = `profileImages/${userId}/${fileName}`;
    
//     // Get references to both locations
//     const stagingRef = ref(storage, stagingPath);
//     const permanentRef = ref(storage, permanentPath);

//     // Get download URL of staged file
//     try {
//       await getDownloadURL(stagingRef);
//     } catch (error) {
//       console.error('Staged file not found:', error);
//       throw new Error('Staged file not found');
//     }

//     // Download staged file
//     const stagingResponse = await fetch(await getDownloadURL(stagingRef));
//     const fileBlob = await stagingResponse.blob();

//     // Upload to permanent location
//     const uploadTask = uploadBytesResumable(permanentRef, fileBlob);

//     const downloadUrl = await new Promise<string>((resolve, reject) => {
//       uploadTask.on(
//         'state_changed',
//         (snapshot) => {
//           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//           this.uploadProgress.next({
//             progress: Math.round(progress),
//             snapshot
//           });
//         },
//         reject,
//         async () => {
//           try {
//             const url = await getDownloadURL(uploadTask.snapshot.ref);
//             resolve(url);
//           } catch (error) {
//             reject(error);
//           }
//         }
//       );
//     });

//     // Delete staged file after successful move
//     await deleteObject(stagingRef);

//     // Remove from tracked staged files
//     this.stagedFiles.delete(userId);

//     console.log('Image moved successfully:', {
//       from: stagingPath,
//       to: permanentPath,
//       url: downloadUrl
//     });

//     return downloadUrl;
    
//   } catch (error) {
//     console.error('Error moving file to permanent storage:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const stagingPath = `staging/profileImages/${userId}/${fileName}`;
//     const permanentPath = `profileImages/${userId}/${fileName}`;
    
//     // Get references to both locations
//     const stagingRef = ref(storage, stagingPath);
//     const permanentRef = ref(storage, permanentPath);

//     // Download staged file
//     const stagingResponse = await fetch(await getDownloadURL(stagingRef));
//     const fileBlob = await stagingResponse.blob();

//     // Upload to permanent location
//     const uploadTask = uploadBytesResumable(permanentRef, fileBlob);

//     const downloadUrl = await new Promise<string>((resolve, reject) => {
//       uploadTask.on(
//         'state_changed',
//         (snapshot) => {
//           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//           this.uploadProgress.next({
//             progress: Math.round(progress),
//             snapshot
//           });
//         },
//         reject,
//         async () => {
//           try {
//             const url = await getDownloadURL(uploadTask.snapshot.ref);
//             resolve(url);
//           } catch (error) {
//             reject(error);
//           }
//         }
//       );
//     });

//     // Delete staged file after successful move
//     await deleteObject(stagingRef);

//     // Return the Firebase URL
//     return downloadUrl;
    
//   } catch (error) {
//     console.error('Error moving file to permanent storage:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const response = await firstValueFrom(
//       this.http.post<any>(`${this.baseUrl}/api/images/profile-picture/${userId}`, {
//         fileName
//       })
//     );

//     if (!response.url) {
//       throw new Error('Failed to move file to permanent storage');
//     }

//     return response.url;
//   } catch (error) {
//     console.error('Error moving file to permanent storage:', error);
//     throw error;
//   }
// }



import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { storage, auth } from '../firebase.config';
import { ref, uploadBytesResumable, getDownloadURL, StorageReference, UploadTaskSnapshot, deleteObject, getStorage } from 'firebase/storage';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

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
  private uploadProgress = new Subject<UploadProgress>();
  private stagedFiles: Map<string, string> = new Map();

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUploadProgress(): Observable<UploadProgress> {
    return this.uploadProgress.asObservable();
  }

  // private getAuthHeaders() {
  //   const token = localStorage.getItem('token');
  //   return {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${token}`
  //     })
  //   };
  // }

  // getAuthHeaders(): { headers: HttpHeaders } {
  //   const token = localStorage.getItem('token');
  //   return {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${token}`,
  //     }),
  //   };
  // }

  // getAuthHeaders(): { headers: HttpHeaders } {
  //   const token = this.authService.getToken();
  //   return {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${token}`,
  //     }),
  //   };
  // }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No auth token available');
    }
    return {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    };
  }

  // private getAuthHeaders(): { headers: HttpHeaders } {
  //   const token = this.authService.getToken();
  //   return {
  //     headers: new HttpHeaders()
  //       .set('Authorization', `Bearer ${token}`)
  //       .set('Cache-Control', 'no-cache')
  //       .set('Pragma', 'no-cache')
  //   };
  // }  

// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${this.baseUrl}/api/images/upload-url/${userId}`, 
//         {
//           contentType: file.type,
//           folder: 'staging/profileImages'
//         },
//         this.getAuthHeaders() // Add auth headers
//       )
//     );

//     if (!response.success) {
//       throw new Error('Failed to upload file');
//     }

//     return response.data.downloadUrl;
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }

// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     // Step 1: Get the signed upload URL from the backend
//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${this.baseUrl}/api/images/upload-url/${userId}`,
//         {
//           contentType: file.type,
//           folder: 'staging/profileImages'
//         },
//         this.getAuthHeaders() // Add auth headers
//       )
//     );

//     if (!response.success) {
//       throw new Error('Failed to get upload URL');
//     }

//     const uploadUrl = response.data.uploadUrl;

//     // Step 2: Upload the file to Firebase Storage using the signed URL
//     const uploadResponse = await fetch(uploadUrl, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': file.type,
//         // Include any additional headers if required
//       },
//       body: file
//     });

//     if (!uploadResponse.ok) {
//       throw new Error('Failed to upload file to Firebase Storage');
//     }

//     // Step 3: Return the download URL for later use
//     return response.data.downloadUrl;

//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }

// firebase.service.ts

// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     // Get the signed upload URL from the backend
//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${this.baseUrl}/api/images/upload-url/${userId}`,
//         {
//           contentType: file.type,
//           folder: 'staging/profileImages'
//         },
//         this.getAuthHeaders()
//       )
//     );

//     if (!response.success) {
//       throw new Error('Failed to get upload URL');
//     }

//     const uploadUrl = response.data.uploadUrl;

//     // Upload the file to Firebase Storage using the signed URL
//     const uploadResponse = await fetch(uploadUrl, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': file.type,
//       },
//       body: file
//     });

//     if (!uploadResponse.ok) {
//       const errorText = await uploadResponse.text();
//       throw new Error(`Failed to upload file to Firebase Storage: ${errorText}`);
//     }

//     // Return the download URL for later use
//     return response.data.downloadUrl;

//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// }


// async uploadFile(file: File, userId: string): Promise<string> {
//   try {
//     const storage = getStorage();
//     const timestamp = Date.now();
//     const filename = `${timestamp}-${file.name}`;
//     const storagePath = `staging/profileImages/${userId}/${filename}`;
//     // const storageRef = ref(storage, `staging/profileImages/${userId}/${file.name}`);
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

async uploadFile(file: File, userId: string): Promise<string> {
  try {
    const storage = getStorage();
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storagePath = `staging/profileImages/${userId}/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        () => resolve()
      );
    });

    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}


async cleanupStagedFile(userId: string): Promise<void> {
    if (!userId) return;
    
    try {
      await firstValueFrom(
        this.http.delete(
          `${this.baseUrl}/api/images/profile-picture/${userId}`,
          this.getAuthHeaders() // Add auth headers
        )
      );
    } catch (error) {
      console.error('Error cleaning up staged file:', error);
    }
  }


// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const response = await firstValueFrom(
//       this.http.put<any>(
//         `${this.baseUrl}/api/images/profile-picture/${userId}`,
//         { fileName },
//         this.getAuthHeaders() // Add auth headers
//       )
//     );

//     if (!response.url) {
//       throw new Error('Failed to move file to permanent storage');
//     }

//     return response.url;
//   } catch (error) {
//     console.error('Error moving file to permanent storage:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const options = this.getAuthHeaders(); // Returns { headers: HttpHeaders }

//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${this.baseUrl}/api/storage/move/${userId}`,
//         { fileName },
//         options // Pass options directly
//       )
//     );

//     if (response.success && response.url) {
//       return response.url;
//     } else {
//       throw new Error(response.message || 'Failed to move file to permanent storage');
//     }
//   } catch (error) {
//     console.error('Error moving file to permanent storage:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const response = await this.http.post<any>(
//       `${this.baseUrl}/api/storage/move/${userId}`,
//       { fileName },
//       this.getAuthHeaders()
//     ).toPromise();

//     if (!response.success) {
//       throw new Error(response.message || 'Failed to move file');
//     }

//     return response.url;
//   } catch (error) {
//     console.error('Error moving to permanent storage:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${environment.apiUrl}/api/storage/move/${userId}`,
//         { fileName },
//         this.getAuthHeaders()
//       )
//     );

//     if (response.success && response.url) {
//       return response.url;
//     } else {
//       throw new Error(response.message || 'Failed to move file');
//     }
//   } catch (error) {
//     console.error('Error moving to permanent storage:', error);
//     throw error;
//   }
// }

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const headers = this.getAuthHeaders();
//     console.log('Making request with headers:', headers);

//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${environment.apiUrl}/api/storage/move/${userId}`,
//         { fileName },
//         headers
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

// async moveToPermStorage(userId: string, fileName: string): Promise<string> {
//   try {
//     const token = await this.authService.getToken();
//     if (!token) {
//       throw new Error('No authentication token available');
//     }

//     const headers = new HttpHeaders()
//       .set('Authorization', `Bearer ${token}`)
//       .set('Content-Type', 'application/json');

//     const response = await firstValueFrom(
//       this.http.post<any>(
//         `${environment.apiUrl}/api/storage/move/${userId}`,
//         { fileName },
//         { headers }
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

// firebase.service.ts
// firebase.service.ts
async moveToPermStorage(userId: string, fileName: string): Promise<string> {
  try {
    const token = await this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Match the exact route from your backend
    const response = await firstValueFrom(
      this.http.post<any>(
        `${environment.apiUrl}/api/storage/move/${userId}`, // Matches backend route
        { fileName },
        {
          headers: new HttpHeaders()
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'application/json')
        }
      )
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to move file');
    }

    return response.url;
  } catch (error) {
    console.error('Error moving to permanent storage:', error);
    throw error;
  }
}

// firebase.service.ts
getFileName(url: string): string {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    // Handle both Firebase Storage URLs and proxied URLs
    if (url.includes('firebasestorage.googleapis.com')) {
      // For Firebase Storage URLs
      // Extract the path after /o/ and before ?
      const match = url.match(/\/o\/(.+?)\?/);
      if (match && match[1]) {
        // URL decode the path and get the last segment
        const fullPath = decodeURIComponent(match[1]);
        const segments = fullPath.split('/');
        return segments[segments.length - 1];
      }
    } else if (url.includes('/api/storage/')) {
      // For proxied URLs
      // Split on the last forward slash to get the filename
      const segments = url.split('/');
      return segments[segments.length - 1];
    }

    // If URL format is not recognized, extract anything after the last slash
    const lastSlashIndex = url.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      // Remove any query parameters
      const fileName = url.substring(lastSlashIndex + 1).split('?')[0];
      return fileName;
    }

    throw new Error('Could not extract filename from URL');
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    throw new Error('Invalid URL format');
  }
}

// Helper method to check if URL is a Firebase Storage URL
private isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
}

// Helper method to check if URL is a proxied URL
private isProxiedUrl(url: string): boolean {
  return url.includes('/api/storage/');
}

  hasStagedFile(userId: string): boolean {
    return this.stagedFiles.has(userId);
  }

  // Add method to get staged file path
  getStagedFilePath(userId: string): string | null {
    return this.stagedFiles.get(userId) || null;
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
        this.http.post<UploadResponse>(`/api/upload-url/${userId}`, {
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
          provider: auth.currentUser?.providerData[0]?.providerId || 'unknown',
          size: file.size.toString()
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

async deleteFile(userId: string, filePath: string): Promise<void> {
  if (!userId || !filePath) {
    throw new Error('Both userId and filePath are required to delete a file');
  }

  try {
    await this.validateUserAuthentication(userId);
    
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    // If this was a staged file, remove from tracking
    if (filePath.startsWith('staging/')) {
      this.stagedFiles.delete(userId);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

}