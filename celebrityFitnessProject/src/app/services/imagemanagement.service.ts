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

interface UserImages {
  urls: string[];
  currentIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageManagementService {
  private readonly MAX_IMAGES_PER_USER = 5;
  private userImagesMap = new Map<string, BehaviorSubject<UserImages>>();
  private imageLoadErrors = new Set<string>();
  private loadingImages = false;
  private temporaryUrl: string | null = null;
  private currentProfilePath: string | null = null;
  private isProviderProfile: boolean = false; 
  private hasStartedNavigating = false;
  private currentImageIndex = 0;
  private imageUrls: string[] = [];
  private selectedImagePath: string | null = null;

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

    // Handle temporary URL first (for when pasting new URLs)
    if (this.temporaryUrl && !this.isProviderProfile) {
      urls = [this.temporaryUrl, ...urls];
      console.log('Added temporary URL at index 0');
      subject.next({
        urls,
        currentIndex: 0
      });
      return;
    }

    // Handle current profile image
    if (this.currentProfilePath) {
      if (this.isProviderProfile) {
        // If current profile is a provider URL, add it to the list
        urls = [this.currentProfilePath, ...urls];
        console.log('Added provider profile URL at index 0');
        subject.next({
          urls,
          currentIndex: 0
        });
      } else {
        // Find Firebase profile image in list
        const currentIndex = urls.findIndex(url => 
          this.getImagePath(url) === this.currentProfilePath
        );

        if (currentIndex !== -1) {
          console.log('Found current profile image at index:', currentIndex);
          subject.next({
            urls,
            currentIndex
          });
        }
      }
      return;
    }

    // Default case
    console.log('Using default ordering');
    subject.next({
      urls,
      currentIndex: 0
    });

  } catch (error) {
    console.error('Error loading user images:', error);
  } finally {
    this.loadingImages = false;
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

  private getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
    console.log('Getting URLs for items:', validItems.map(item => item.path));
    
    return Promise.all(
      validItems.map(async (item) => {
        try {
          const url = await getDownloadURL(item.ref);
          const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
          const exists = await this.verifyImageExists(proxiedUrl);
          if (!exists) {
            console.log('File not accessible:', item.path);
            return null;
          }
          return proxiedUrl;
        } catch (error) {
          console.error('Error getting download URL for:', item.path, error);
          return null;
        }
      })
    ).then(urls => urls.filter((url): url is string => url !== null));
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
async uploadImage(userId: string, file: File): Promise<string> {
    try {
      if (!auth.currentUser) {
        await this.firebaseService.refreshAuth();
        if (!auth.currentUser) {
          throw new Error('User not authenticated');
        }
      }
  
      // Check current image count
      const subject = this.getUserImagesSubject(userId);
      if (subject.value.urls.length >= this.MAX_IMAGES_PER_USER) {
        throw new Error(`Maximum of ${this.MAX_IMAGES_PER_USER} images allowed`);
      }
  
      // Don't pass fileName to uploadFile, let FirebaseService handle it
      const downloadURL = await this.firebaseService.uploadFile(file, userId);
  
      // Add a slight delay to ensure Firebase propagation
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      // Refresh the images list
      await this.loadUserImages(userId);
  
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  private async ensureAuthenticated() {
    if (!auth.currentUser) {
      await this.firebaseService.refreshAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
    }
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
async deleteCurrentImage(userId: string): Promise<void> {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length === 0) return;

  try {
    const urlToDelete = current.urls[current.currentIndex];
    await this.deleteImageByUrl(urlToDelete);
    await this.waitForFirebaseUpdate();
    await this.loadUserImages(userId);
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
  
getCurrentImageUrl(userId: string): Observable<string> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => {
      if (state.urls.length === 0) return '';
      return state.urls[state.currentIndex] || '';
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

getCurrentImage(userId: string): Observable<string | null> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => {
      if (state.urls.length === 0) return null;
      const validIndex = Math.min(state.currentIndex, state.urls.length - 1);
      return state.urls[validIndex] || null;
    }),
    switchMap(async (url) => {
      if (!url) return null;
      
      // If it's already a Firebase path, return as is
      if (url.startsWith('profileImages/')) {
        return url;
      }
      
      // If it's a Firebase URL, extract the path
      if (url.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(url);
        return decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
      }
      
      // If it's a proxied URL, extract the path
      if (url.includes('/api/storage/')) {
        return url.split('/api/storage/')[1];
      }
      
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
