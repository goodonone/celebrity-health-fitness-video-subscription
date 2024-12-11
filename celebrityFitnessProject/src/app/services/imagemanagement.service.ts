import { Injectable } from '@angular/core';
import { storage, auth } from '../firebase.config';
import { ref, listAll, getDownloadURL, deleteObject, StorageReference, uploadBytesResumable, getMetadata } from 'firebase/storage';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { StorageService } from './storage.service';
import { Auth } from 'firebase/auth';
import { AuthService } from './auth.service';
import { User } from '../models/user';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';

interface UserImages {
  urls: string[];
  currentIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageManagementService {
  
  private readonly baseUrl = environment.apiUrl;
  private userImagesMap = new Map<string, BehaviorSubject<UserImages>>();
  private imageLoadErrors = new Set<string>();
  private loadingImages = false;
  public temporaryUrl: string | null = null;
  private currentProfilePath: string | null = null;
  private isProviderProfile: boolean = false; 
  private hasStartedNavigating = false;
  private preloadedImages = new Map<string, boolean>();
  private currentImageIndex = 0;
  private imageUrls: string[] = [];
  private selectedImagePath: string | null = null;
  private hasFirebaseImagesSubject = new BehaviorSubject<boolean>(false);
  hasFirebaseImages$ = this.hasFirebaseImagesSubject.asObservable();
  private firebaseImageCount = 0;
  private currentProfileImage: string | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private storageService: StorageService,
    private authService: AuthService,
    private userService: UserService
  ) {}

// Subject Management
getUserImagesSubject(userId: string): BehaviorSubject<UserImages> {
  if (!this.userImagesMap.has(userId)) {
    this.userImagesMap.set(userId, new BehaviorSubject<UserImages>({
      urls: [],
      currentIndex: 0
    }));
  }
  return this.userImagesMap.get(userId)!;
}

isLoading(): boolean {
  return this.loadingImages;
}

setCurrentProfileImage(path: string) {
  // If it's a provider URL, store it as is
  if (this.isProviderUrl(path)) {
    this.currentProfilePath = path;
    this.isProviderProfile = true;
  } else {
    this.currentProfilePath = this.getImagePath(path);
    this.isProviderProfile = false;
  }
  console.log('Set current profile path:', this.currentProfilePath, 'isProvider:', this.isProviderProfile);
}

setTemporaryUrl(url: string | null) {
  this.temporaryUrl = url;
  // Don't clear current profile path here anymore
  
  if (url) {
    const subject = this.getUserImagesSubject(this.userService.getUserId());
    const currentUrls = subject.value.urls;
    const firebaseUrls = currentUrls.filter(u => !this.isProviderUrl(u));
    const newUrls = [url, ...firebaseUrls];
    
    subject.next({
      urls: newUrls,
      currentIndex: 0
    });
  }
  console.log('Temporary URL set and navigation updated:', url);
}
  
clearTemporaryUrl() {
  this.temporaryUrl = null;
}

// Working
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // Get all images from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Initial URLs array:', urls);

//     // Build final URL array as before
//     let finalUrls: string[] = [];
//     let currentIndex = 0;

//     if (this.temporaryUrl && !this.isProviderProfile) {
//       finalUrls = [this.temporaryUrl, ...urls];
//       currentIndex = 0;
//     } else if (this.currentProfilePath) {
//       if (this.isProviderProfile) {
//         finalUrls = [this.currentProfilePath, ...urls];
//         currentIndex = 0;
//       } else {
//         finalUrls = [...urls];
//         const foundIndex = urls.findIndex(url => 
//           this.getImagePath(url) === this.currentProfilePath
//         );
//         if (foundIndex !== -1) {
//           currentIndex = foundIndex;
//         }
//       }
//     } else {
//       finalUrls = urls;
//     }

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         try {
//           // Convert URL if needed
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Get headers if needed
//           const headers = displayUrl.includes('/api/storage/') ?
//             await this.storageService.getAuthHeaders() : undefined;

//           // Create a cached blob
//           if (headers) {
//             const response = await fetch(displayUrl, { headers });
//             if (!response.ok) throw new Error('Failed to fetch image');
//             const blob = await response.blob();
//             const objectUrl = URL.createObjectURL(blob);

//             // Wait for image to load completely
//             await new Promise<void>((resolve, reject) => {
//               const img = new Image();
//               img.onload = () => {
//                 this.preloadedImages.set(url, true);
//                 resolve();
//               };
//               img.onerror = reject;
//               img.src = objectUrl;
//             });

//             return { originalUrl: url, displayUrl: objectUrl };
//           } else {
//             // For external URLs, still wait for load but don't create blob
//             await new Promise<void>((resolve, reject) => {
//               const img = new Image();
//               img.onload = () => {
//                 this.preloadedImages.set(url, true);
//                 resolve();
//               };
//               img.onerror = reject;
//               img.src = displayUrl;
//             });

//             return { originalUrl: url, displayUrl };
//           }
//         } catch (error) {
//           console.error('Error preloading image:', url, error);
//           return { originalUrl: url, displayUrl: url };
//         }
//       })
//     );

//     // Create map of preloaded URLs
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Update state with preloaded URLs
//     subject.next({
//       urls: finalUrls.map(url => urlMap.get(url) || url),
//       currentIndex
//     });

//     console.log('All images preloaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// Last Working
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     console.log('Initial URLs array:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);
//     console.log('Firebase images found:', urls.length > 0);

//     // First ensure all URLs are in the correct format
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // Build final URL array
//     let finalUrls: string[] = [];
//     let currentIndex = 0;

//     if (this.temporaryUrl && !this.isProviderProfile) {
//       finalUrls = [this.temporaryUrl, ...urls];
//       currentIndex = 0;
//     } else if (this.currentProfilePath) {
//       if (this.isProviderProfile) {
//         finalUrls = [this.currentProfilePath, ...urls];
//         currentIndex = 0;
//       } else {
//         finalUrls = [...urls];
//         const normalizedProfilePath = this.normalizeUrl(this.currentProfilePath);
//         const foundIndex = urls.findIndex(url =>
//           this.normalizeUrl(this.getImagePath(url)) === normalizedProfilePath
//         );
//         if (foundIndex !== -1) {
//           currentIndex = foundIndex;
//         }
//       }
//     } else {
//       finalUrls = urls;
//     }

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         try {
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           const headers = displayUrl.includes('/api/storage/') ?
//             await this.storageService.getAuthHeaders() : undefined;

//           if (headers) {
//             const response = await fetch(displayUrl, { headers });
//             if (!response.ok) throw new Error('Failed to fetch image');
//             const blob = await response.blob();
//             const objectUrl = URL.createObjectURL(blob);

//             await new Promise<void>((resolve, reject) => {
//               const img = new Image();
//               img.onload = () => {
//                 this.preloadedImages.set(url, true);
//                 resolve();
//               };
//               img.onerror = reject;
//               img.src = objectUrl;
//             });

//             return { originalUrl: url, displayUrl: objectUrl };
//           } else {
//             await new Promise<void>((resolve, reject) => {
//               const img = new Image();
//               img.onload = () => {
//                 this.preloadedImages.set(url, true);
//                 resolve();
//               };
//               img.onerror = reject;
//               img.src = displayUrl;
//             });

//             return { originalUrl: url, displayUrl };
//           }
//         } catch (error) {
//           console.error('Error preloading image:', url, error);
//           return { originalUrl: url, displayUrl: url };
//         }
//       })
//     );

//     // Create map of preloaded URLs
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Update state with preloaded URLs
//     subject.next({
//       urls: finalUrls.map(url => urlMap.get(url) || url),
//       currentIndex
//     });

//     console.log('All images preloaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//   } finally {
//     this.loadingImages = false;
//   }
// }

async loadUserImages(userId: string): Promise<void> {
  console.log('Loading user images for:', userId);
  if (this.loadingImages) return;

  this.loadingImages = true;
  const subject = this.getUserImagesSubject(userId);

  try {
    // List files from Firebase
    const imagesRef = ref(storage, `profileImages/${userId}`);
    const result = await listAll(imagesRef);
    const validItems = await this.getValidItemsWithMetadata(result.items);
    let urls = await this.getValidUrls(validItems);
    
    console.log('Initial URLs array:', urls);

    // Update hasFirebaseImages state
    this.firebaseImageCount = urls.length;
    this.hasFirebaseImagesSubject.next(urls.length > 0);
    console.log('Firebase images found:', urls.length > 0);

    // First ensure all URLs are in the correct format
    urls = await Promise.all(urls.map(async (url) => {
      if (url.includes('firebasestorage.googleapis.com')) {
        return this.storageService.convertFirebaseUrl(url);
      }
      return url;
    }));

    // Build final URL array
    let finalUrls: string[] = [];
    let currentIndex = 0;

    if (this.temporaryUrl && !this.isProviderProfile) {
      finalUrls = [this.temporaryUrl, ...urls];
      currentIndex = 0;
    } else if (this.currentProfilePath) {
      if (this.isProviderProfile) {
        finalUrls = [this.currentProfilePath, ...urls];
        currentIndex = 0;
      } else {
        finalUrls = [...urls];
        const normalizedProfilePath = this.normalizeUrl(this.currentProfilePath);
        const foundIndex = urls.findIndex(url =>
          this.normalizeUrl(this.getImagePath(url)) === normalizedProfilePath
        );
        if (foundIndex !== -1) {
          currentIndex = foundIndex;
        }
      }
    } else {
      finalUrls = urls;
    }

    // Preload images with converted URLs and blob caching
    const preloadedUrls = await Promise.all(
      finalUrls.map(async (url, index) => {
        try {
          // Check if this is the current profile image
          const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
          const displayUrl = url.includes('firebasestorage.googleapis.com') ?
            await this.storageService.convertFirebaseUrl(url) : url;

          // Skip blob creation for profile image
          if (isCurrentProfile) {
            return { originalUrl: url, displayUrl };
          }

          const headers = displayUrl.includes('/api/storage/') ?
            await this.storageService.getAuthHeaders() : undefined;

          if (headers) {
            const response = await fetch(displayUrl, { headers });
            if (!response.ok) throw new Error('Failed to fetch image');
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                this.preloadedImages.set(url, true);
                resolve();
              };
              img.onerror = reject;
              img.src = objectUrl;
            });

            return { originalUrl: url, displayUrl: objectUrl };
          } else {
            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                this.preloadedImages.set(url, true);
                resolve();
              };
              img.onerror = reject;
              img.src = displayUrl;
            });

            return { originalUrl: url, displayUrl };
          }
        } catch (error) {
          console.error('Error preloading image:', url, error);
          return { originalUrl: url, displayUrl: url };
        }
      })
    );

    // Create map of preloaded URLs
    const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

    // Update state with preloaded URLs
    subject.next({
      urls: finalUrls.map(url => urlMap.get(url) || url),
      currentIndex
    });

    console.log('All images preloaded successfully');

  } catch (error) {
    console.error('Error loading user images:', error);
    this.firebaseImageCount = 0;
    this.hasFirebaseImagesSubject.next(false);
  } finally {
    this.loadingImages = false;
  }
}

hasAnyFirebaseImages(): boolean {
  return this.firebaseImageCount > 0;
}

private async preloadAllImages(urls: string[]): Promise<void> {
  try {
    const preloadPromises = urls.map(url => this.preloadSingleImage(url));
    await Promise.all(preloadPromises);
    console.log('All images preloaded successfully');
  } catch (error) {
    console.error('Error preloading images:', error);
  }
}

private async preloadSingleImage(url: string): Promise<void> {
  if (this.preloadedImages.has(url)) return;

  try {
    let displayUrl = url;
    
    // Convert URL if needed
    if (url.includes('firebasestorage.googleapis.com')) {
      displayUrl = await this.storageService.convertFirebaseUrl(url);
    }

    // Get auth headers if needed
    const headers = displayUrl.includes('/api/storage/') ?
      await this.storageService.getAuthHeaders() : undefined;

    await new Promise<void>(async (resolve, reject) => {
      try {
        if (headers) {
          const response = await fetch(displayUrl, { headers });
          if (!response.ok) throw new Error('Failed to fetch image');
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            this.preloadedImages.set(url, true);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image load failed'));
          };
          img.src = objectUrl;
        } else {
          const img = new Image();
          img.onload = () => {
            this.preloadedImages.set(url, true);
            resolve();
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = displayUrl;
        }
      } catch (error) {
        reject(error);
      }
    });

  } catch (error) {
    console.error('Error preloading image:', error);
    throw error;
  }
}



// Method to extract just the path portion
getImagePath(url: string): string {
  if (!url) return '';
  
  if (url.includes('firebasestorage.googleapis.com')) {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
  } else if (url.includes('/api/storage/')) {
    return url.split('/api/storage/')[1];
  } else if (url.startsWith('profileImages/')) {
    return url;
  }
  return url;
}

// Update normalizeUrl to use getImagePath
normalizeUrl(url: string): string {
  return this.getImagePath(url);
}

// Add helper method to check if URL is from Firebase
private isFirebaseUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('/api/storage/profileImages/');
}

isProviderUrl(url: string): boolean {
  const providerDomains = [
    'unsplash.com',
    'images.unsplash.com',
    'pexels.com',
    'images.pexels.com',
    'pixabay.com'
    // Add other providers as needed
  ];

  try {
    const urlObj = new URL(url);
    return providerDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

private async getValidItemsWithMetadata(items: StorageReference[]) {
  const itemsWithMetadata = await Promise.all(
    items.map(async (item) => {
      try {
        const metadata = await getMetadata(item);
        return {
          ref: item,
          metadata,
          path: item.fullPath,
          timeCreated: new Date(metadata.timeCreated).getTime()
        };
      } catch (error) {
        console.error('Error getting metadata for:', item.fullPath, error);
        return null;
      }
    })
  );

  return itemsWithMetadata
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.timeCreated - b.timeCreated); // Changed from b - a to a - b
}

// async getOriginalPath(userId: string, index: number): Promise<string | null> {
//   try {
//     // Get original URLs (before blob conversion)
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     const urls = await this.getValidUrls(validItems);

//     if (index >= 0 && index < urls.length) {
//       return urls[index];
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting original path:', error);
//     return null;
//   }
// }



  // private getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
  //   console.log('Getting URLs for items:', validItems.map(item => item.path));
    
  //   return Promise.all(
  //     validItems.map(async (item) => {
  //       try {
  //         const url = await getDownloadURL(item.ref);
  //         const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
  //         const exists = await this.verifyImageExists(proxiedUrl);
  //         if (!exists) {
  //           console.log('File not accessible:', item.path);
  //           return null;
  //         }
  //         return proxiedUrl;
  //       } catch (error) {
  //         console.error('Error getting download URL for:', item.path, error);
  //         return null;
  //       }
  //     })
  //   ).then(urls => urls.filter((url): url is string => url !== null));
  // }

// private async getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
//   console.log('Getting URLs for items:', validItems.map(item => item.path));
  
//   return Promise.all(
//     validItems.map(async (item) => {
//       try {
//         // Get Firebase URL
//         const firebaseUrl = await getDownloadURL(item.ref);
        
//         // Convert to proxied URL
//         const proxiedUrl = await this.storageService.convertFirebaseUrl(firebaseUrl);
        
//         // Verify image exists
//         const exists = await this.verifyImageExists(proxiedUrl);
//         if (!exists) {
//           console.log('File not accessible:', item.path);
//           return null;
//         }
        
//         // Return the proxied URL directly
//         return proxiedUrl;
//       } catch (error) {
//         console.error('Error getting download URL for:', item.path, error);
//         return null;
//       }
//     })
//   ).then(urls => urls.filter((url): url is string => url !== null));
// }

private async getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
  console.log('Getting URLs for items:', validItems.map(item => item.path));
  
  return Promise.all(
    validItems.map(async (item) => {
      try {
        // Get Firebase URL
        const firebaseUrl = await getDownloadURL(item.ref);
        
        // Convert to proxied URL
        const proxiedUrl = await this.storageService.convertFirebaseUrl(firebaseUrl);
        
        // Verify image exists
        const exists = await this.verifyImageExists(proxiedUrl);
        if (!exists) {
          console.log('File not accessible:', item.path);
          return null;
        }
        
        // Return the proxied URL directly
        return proxiedUrl;
      } catch (error) {
        console.error('Error getting download URL for:', item.path, error);
        return null;
      }
    })
  ).then(urls => urls.filter((url): url is string => url !== null));
}
  
async getOriginalPath(userId: string, index: number): Promise<string | null> {
  try {
    const imagesRef = ref(storage, `profileImages/${userId}`);
    const result = await listAll(imagesRef);
    const validItems = await this.getValidItemsWithMetadata(result.items);
    const paths = await this.getOriginalPaths(validItems);

    if (index >= 0 && index < paths.length) {
      return paths[index];
    }
    return null;
  } catch (error) {
    console.error('Error getting original path:', error);
    return null;
  }
}
  
private async getOriginalPaths(validItems: Array<{ ref: StorageReference; path: string }>) {
  console.log('Getting original paths for items:', validItems.map(item => item.path));
  
  return Promise.all(
    validItems.map(async (item) => {
      try {
        return item.path; // Return the Firebase path directly
      } catch (error) {
        console.error('Error getting path for:', item.path, error);
        return null;
      }
    })
  ).then(paths => paths.filter((path): path is string => path !== null));
}

private updateUserImagesState(userId: string, urls: string[], currentImage: string | null) {
  const subject = this.getUserImagesSubject(userId);
  
  // Find the index of the current image in the new array
  const currentIndex = currentImage ? urls.findIndex(url => 
    this.normalizeUrl(url) === this.normalizeUrl(currentImage)
  ) : 0;

  console.log('Updating user images state:', {
    userId,
    urlCount: urls.length,
    currentImage,
    currentIndex,
    urls
  });

  subject.next({
    urls,
    currentIndex: Math.max(0, currentIndex) // Ensure we never have a negative index
  });
}

isFirstImage(userId: string): boolean {
  const subject = this.getUserImagesSubject(userId);
  return subject.value.currentIndex === 0;
}

async verifyImageExists(url: string): Promise<boolean> {
  try {
    let fetchUrl = url;
    let headers: { [key: string]: string } = {};

    // Get auth headers if needed
    if (url.includes('/api/storage/')) {
      const token = await this.authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    console.log('Verifying image access:', {
      url: fetchUrl,
      hasAuth: !!headers['Authorization']
    });

    const response = await fetch(fetchUrl, { 
      method: 'HEAD',
      headers
    });

    if (!response.ok) {
      console.warn('Image verification failed:', {
        status: response.status,
        url: fetchUrl
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying image:', error);
    return false;
  }
}
  
  // Helper method for cleaner error handling
  private async safeImageFetch(url: string, options: RequestInit = {}): Promise<boolean> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.ok;
    } catch (error) {
      console.error(`Error fetching URL (${url}):`, error);
      return false;
    }
  }
  
  // Optional: Add retry mechanism for flaky connections
  private async retryFetch(
    url: string, 
    options: RequestInit = {}, 
    retries: number = 3
  ): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.safeImageFetch(url, options);
        if (result) return true;
        
        // Add exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Retry ${i + 1}/${retries} failed for ${url}`);
      }
    }
    return false;
  }
  
  // Usage with retry
  async verifyImageExistsWithRetry(url: string): Promise<boolean> {
    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
        if (!proxiedUrl) return false;
        
        return await this.retryFetch(proxiedUrl, { 
          method: 'HEAD' 
        });
      }
      
      return await this.retryFetch(url, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
    } catch (error) {
      console.error('Error verifying image with retry:', error);
      return false;
    }
  }

  private async getDisplayUrl(url: string): Promise<string> {
    if (!url) return '';
    return url.includes('firebasestorage.googleapis.com') ? 
      await this.storageService.convertFirebaseUrl(url) : 
      url;
  }

  // Image Upload and Management
//   async uploadImage(userId: string, file: File): Promise<string> {
//     try {
//       await this.ensureAuthenticated();
//       await this.checkImageLimit(userId);

//       const fileName = this.generateUniqueFileName(file.name);
//       const downloadURL = await this.firebaseService.uploadFile(file, userId, fileName);

//       await this.waitForFirebaseUpdate();
//       await this.loadUserImages(userId);

//       return downloadURL;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

// async uploadImage(userId: string, file: File): Promise<string> {
//     try {
//       if (!auth.currentUser) {
//         await this.firebaseService.refreshAuth();
//         if (!auth.currentUser) {
//           throw new Error('User not authenticated');
//         }
//       }
  
//       // Check current image count
//       const subject = this.getUserImagesSubject(userId);
//       if (subject.value.urls.length >= this.MAX_IMAGES_PER_USER) {
//         throw new Error(`Maximum of ${this.MAX_IMAGES_PER_USER} images allowed`);
//       }
  
//       // Don't pass fileName to uploadFile, let FirebaseService handle it
//       const downloadURL = await this.firebaseService.uploadFile(file, userId);
  
//       // Add a slight delay to ensure Firebase propagation
//       await new Promise(resolve => setTimeout(resolve, 1000));
  
//       // Refresh the images list
//       await this.loadUserImages(userId);
  
//       return downloadURL;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

private async ensureAuthenticated() {
  if (!auth.currentUser) {
    await this.firebaseService.refreshAuth();
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
  }
}

private ensureProxiedUrl(url: string, userId: string): string {
  if (url.startsWith('blob:')) {
    const pathMatch = url.match(/\/([^/]+)$/);
    if (pathMatch) {
      return `${this.baseUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
    }
  }
  return url;
}

// async initializeImages(userId: string): Promise<void> {
//   // Load all images from Firebase
//   this.imageUrls = await this.storageService.listProfileImages(userId);
  
//   // Get user's selected image path from database
//   const userProfile = await this.userService.getUserProfile(userId);
//   this.selectedImagePath = userProfile.imgUrl;

//   // Set current index based on selected image
//   if (this.selectedImagePath) {
//     const index = this.imageUrls.findIndex(url => url === this.selectedImagePath);
//     this.currentImageIndex = index >= 0 ? index : 0;
//   }
// }

// async navigateImages(direction: 'next' | 'prev'): Promise<string> {
//   if (direction === 'next') {
//     this.currentImageIndex = (this.currentImageIndex + 1) % this.imageUrls.length;
//   } else {
//     this.currentImageIndex = this.currentImageIndex === 0 ? 
//       this.imageUrls.length - 1 : 
//       this.currentImageIndex - 1;
//   }

//   const newPath = this.imageUrls[this.currentImageIndex];
//   await this.saveSelectedImage(newPath);
//   return newPath;
// }

private async saveSelectedImage(imagePath: string): Promise<void> {
  this.selectedImagePath = imagePath;
  // Update user profile with selected image
  await this.userService.updateProfile({
    imgUrl: imagePath
  });
}

setInitialImage(userId: string, currentImageUrl: string) {
  const subject = this.getUserImagesSubject(userId);
  const state = subject.value;
  
  // Find the index of current image
  const currentIndex = state.urls.findIndex(url => url.includes(currentImageUrl));
  
  if (currentIndex !== -1) {
    console.log('Setting initial image index:', currentIndex);
    subject.next({
      ...state,
      currentIndex
    });
  }
}

// private async checkImageLimit(userId: string) {
//   const subject = this.getUserImagesSubject(userId);
//   if (subject.value.urls.length >= this.MAX_IMAGES_PER_USER) {
//     throw new Error(`Maximum of ${this.MAX_IMAGES_PER_USER} images allowed`);
//   }
// }

// async getInitialImageCount(userId: string): Promise<number> {
//   try {
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     return result.items.length;
//   } catch (error) {
//     console.error('Error getting initial image count:', error);
//     return 0;
//   }
// }

// async getInitialImageCount(userId: string): Promise<{count: number}> {
//   try {
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     return { count: result.items.length };
//   } catch (error) {
//     console.error('Error getting initial image count:', error);
//     return { count: 0 };
//   }
// }

async getInitialImageCount(userId: string): Promise<{count: number}> {
  try {
    const imagesRef = ref(storage, `profileImages/${userId}`);
    const result = await listAll(imagesRef);
    
    // Get base count from Firebase storage
    let totalCount = result.items.length;
    
    // Add 1 to count if current profile is a provider URL
    if (this.currentProfilePath && this.isProviderProfile) {
      totalCount += 1;
    }

    return { count: totalCount };
  } catch (error) {
    console.error('Error getting initial image count:', error);
    return { count: 0 };
  }
}

// async getInitialImageCount(userId: string): Promise<{count: number, profileUrl: string | null}> {
//   try {
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
    
//     // If there are images, get the URL of the first one
//     let profileUrl: string | null = null;
//     if (result.items.length > 0) {
//       const firstItem = result.items[0];
//       const path = firstItem.fullPath;
//       profileUrl = `${environment.apiUrl}/api/storage/${path}`;
//     }

//     return {
//       count: result.items.length,
//       profileUrl
//     };
//   } catch (error) {
//     console.error('Error getting initial image count:', error);
//     return { count: 0, profileUrl: null };
//   }
// }

private generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  return `${timestamp}-${randomString}-${safeFileName}`;
}

private async waitForFirebaseUpdate(delay: number = 1000) {
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Image Deletion
// async deleteCurrentImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length === 0) return;

//   try {
//     const urlToDelete = current.urls[current.currentIndex];
//     await this.deleteImageByUrl(urlToDelete);
//     await this.waitForFirebaseUpdate();
//     await this.loadUserImages(userId);

//     // Update firebaseImageCount and hasFirebaseImages state
//     this.firebaseImageCount--;
//     this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
//   } catch (error) {
//     console.error('Error deleting image:', error);
//     throw error;
//   }
// }

// Image Deletion
// async deleteCurrentImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length === 0) return;

//   try {
//     const urlToDelete = current.urls[current.currentIndex];
//     await this.deleteImageByUrl(urlToDelete);
//     await this.waitForFirebaseUpdate();

//     // Immediately update the count
//     this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
//     this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);

//     // Remove the deleted URL from the current state
//     const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
//     const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);
    
//     // Update the state immediately
//     subject.next({
//       urls: updatedUrls,
//       currentIndex: Math.max(0, newIndex)
//     });

//     // Then reload all images to ensure everything is in sync
//     await this.loadUserImages(userId);

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     throw error;
//   }
// }

// Image Deletion
async deleteCurrentImage(userId: string): Promise<void> {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length === 0) return;

  try {
    const currentUrl = current.urls[current.currentIndex];
    const isProvider = this.isProviderUrl(currentUrl);
    let previousImageCount = current.urls.length;

    // Remove the URL first to enable immediate UI update
    const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
    const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);

    // If it's a Firebase image, delete from storage
    if (!isProvider) {
      await this.deleteImageByUrl(currentUrl);
      this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
      this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
    } else {
      // If it's a provider URL, just clear it
      this.temporaryUrl = null;
    }

    // Update the state immediately to show next image
    subject.next({
      urls: updatedUrls,
      currentIndex: Math.max(0, newIndex)
    });

    // Update image count state
    // this.imageCount = updatedUrls.length;
    // this.showImageNavigation = this.imageCount > 1;

    // If we deleted the last image, clear current profile image
    if (updatedUrls.length === 0) {
      // Notify that there are no images left
      this.hasFirebaseImagesSubject.next(false);
      this.currentProfileImage = null;
    } else {
      // Set the next image as current
      this.currentProfileImage = updatedUrls[newIndex];
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

private async deleteImageByUrl(url: string) {
  const urlObj = new URL(url);
  const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
  const imageRef = ref(storage, path);
  await deleteObject(imageRef);
}

// URL Management and Validation
async checkAndUpdateImageUrl(userId: string, url: string): Promise<string | null> {
  if (!url) return null;
  
  try {
    const exists = await this.verifyImageExists(url);
    if (!exists) {
      this.imageLoadErrors.add(url);
      await this.loadUserImages(userId);
      return null;
    }
    return url;
  } catch (error) {
    console.error('Error checking image:', error);
    this.imageLoadErrors.add(url);
    return null;
  }
}
  
// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
//       return state.urls[state.currentIndex] || '';
//     })
//   );
// }

getCurrentImageUrl(userId: string): Observable<string> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => {
      if (state.urls.length === 0) return '';
      
      const currentUrl = state.urls[state.currentIndex] || '';
      // Always ensure we're returning a proxied URL, not a blob URL
      if (currentUrl.startsWith('blob:')) {
        const pathMatch = currentUrl.match(/\/([^/]+)$/);
        if (pathMatch) {
          return `${this.baseUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
        }
      }
      return currentUrl;
    })
  );
}

// getCurrentImage(userId: string): Observable<string | null> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return null;
//       // Ensure index is valid
//       const validIndex = Math.min(state.currentIndex, state.urls.length - 1);
//       return state.urls[validIndex] || null;
//     }),
//     switchMap(async (url) => {
//       if (!url) return null;
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     })
//   );
// }

// Latest Working
// getCurrentImage(userId: string): Observable<string | null> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return null;
//       const validIndex = Math.min(state.currentIndex, state.urls.length - 1);
//       return state.urls[validIndex] || null;
//     }),
//     switchMap(async (url) => {
//       if (!url) return null;
      
//       // If it's already a Firebase path, return as is
//       if (url.startsWith('profileImages/')) {
//         return url;
//       }
      
//       // If it's a Firebase URL, extract the path
//       if (url.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(url);
//         return decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//       }
      
//       // If it's a proxied URL, extract the path
//       if (url.includes('/api/storage/')) {
//         return url.split('/api/storage/')[1];
//       }
      
//       return url;
//     })
//   );
// }

getCurrentImage(userId: string): Observable<string | null> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => {
      if (state.urls.length === 0) return null;
      const validIndex = Math.min(state.currentIndex, state.urls.length - 1);
      return state.urls[validIndex] || null;
    }),
    // Add switchMap to resolve any promises
    switchMap(async (url) => {
      if (!url) return null;

      // If it's already a proxied URL, return it directly
      if (url.includes('/api/storage/')) {
        return url;
      }
      
      // If it's a Firebase URL, convert it synchronously
      // if (url.includes('firebasestorage.googleapis.com')) {
      //   const displayUrl = await this.storageService.convertFirebaseUrl(url);
      //   return displayUrl;
      // }
      
      // For provider URLs or other URLs, return as is
      return url;
    })
  );
}

getImages(userId: string): Observable<string[]> {
  return this.getUserImagesSubject(userId).pipe(
    switchMap(async (state) => {
      const processedUrls = await Promise.all(
        state.urls.map(async url => 
          url.includes('firebasestorage.googleapis.com') ? 
            await this.storageService.convertFirebaseUrl(url) : 
            url
        )
      );
      return processedUrls;
    })
  );
}

getImageCount(userId: string): Observable<number> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => state.urls.length)
  );
}

nextImage(userId: string): void {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length <= 1) return;
  
  const newIndex = (current.currentIndex + 1) % current.urls.length;

  // Set flag that we're started navigation
  this.hasStartedNavigating = true;
  
  // console.log('Navigating to next image:', {
  //   oldIndex: current.currentIndex,
  //   newIndex,
  //   totalImages: current.urls.length,
    
  // });

  console.log('Navigating to next image:', {
    oldIndex: current.currentIndex,
    newIndex,
    totalImages: current.urls.length,
    isFirstImage: newIndex === 0,
    hasStartedNavigating: this.hasStartedNavigating
  });
  
  subject.next({
    ...current,
    currentIndex: newIndex
  });
}

previousImage(userId: string): void {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length <= 1) return;
  
  const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  
  // Set flag that we've started navigating
  this.hasStartedNavigating = true;

  // console.log('Navigating to previous image:', {
  //   oldIndex: current.currentIndex,
  //   newIndex,
  //   totalImages: current.urls.length,
  //   isFirstImage: newIndex === 0
  // });

  console.log('Navigating to previous image:', {
    oldIndex: current.currentIndex,
    newIndex,
    totalImages: current.urls.length,
    hasStartedNavigating: this.hasStartedNavigating
  });
  
  subject.next({
    ...current,
    currentIndex: newIndex
  });
}

// Add method to get navigation status
startedNavigating(): boolean {
  return this.hasStartedNavigating;
}

// Reset flag when exiting change picture state
resetNavigation(): void {
  this.hasStartedNavigating = false;
}

private async preloadNextImage(userId: string, index: number): Promise<void> {
  const subject = this.getUserImagesSubject(userId);
  const urls = subject.value.urls;
  
  if (index >= 0 && index < urls.length) {
    const nextUrl = urls[index];
    try {
      // Preload the image
      const img = new Image();
      img.src = await this.storageService.convertFirebaseUrl(nextUrl);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } catch (error) {
      console.error('Error preloading next image:', error);
    }
  }
}

private navigateImage(userId: string, direction: number): void {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  if (current.urls.length > 0) {
    const newIndex = (current.currentIndex + direction + current.urls.length) % current.urls.length;
    subject.next({
      ...current,
      currentIndex: newIndex
    });
  }
}

// Error Handling
isImageError(url: string): boolean {
  return this.imageLoadErrors.has(url);
}
}