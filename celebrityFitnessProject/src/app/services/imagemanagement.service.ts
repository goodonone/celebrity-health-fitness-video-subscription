import { Injectable } from '@angular/core';
import { storage, auth } from '../firebase.config';
import { ref, listAll, getDownloadURL, deleteObject, StorageReference, uploadBytesResumable, getMetadata } from 'firebase/storage';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { StorageService } from './storage.service';

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

  constructor(
    private firebaseService: FirebaseService,
    private storageService: StorageService
  ) {}

  // Subject Management
  private getUserImagesSubject(userId: string): BehaviorSubject<UserImages> {
    if (!this.userImagesMap.has(userId)) {
      this.userImagesMap.set(userId, new BehaviorSubject<UserImages>({
        urls: [],
        currentIndex: 0
      }));
    }
    return this.userImagesMap.get(userId)!;
  }

  // Image Loading and Verification
  async loadUserImages(userId: string): Promise<void> {
    if (this.loadingImages) {
      console.log('Already loading images, skipping...');
      return;
    }
  
    this.loadingImages = true;
    const imagesRef = ref(storage, `profileImages/${userId}`);
  
    try {
      const result = await listAll(imagesRef);
      console.log('Initial file list:', result.items.map(item => item.fullPath));
  
      const validItems = await this.getValidItemsWithMetadata(result.items);
      console.log('Valid items:', validItems.map(item => ({
        path: item.path,
        timeCreated: new Date(item.timeCreated)
      })));
  
      const urls = await this.getValidUrls(validItems);
      console.log('Final valid URLs:', urls);
  
      this.updateUserImagesState(userId, urls);
  
    } catch (error) {
      console.error('Error loading user images:', error);
      throw error;
    } finally {
      this.loadingImages = false;
    }
  }
  // async loadUserImages(userId: string): Promise<void> {
  //   if (this.loadingImages) {
  //     console.log('Already loading images, skipping...');
  //     return;
  //   }

  //   this.loadingImages = true;
  //   const imagesRef = ref(storage, `profileImages/${userId}`);

  //   try {
  //     // Get list of files
  //     const result = await listAll(imagesRef);
  //     console.log('Initial file list:', result.items.map(item => item.fullPath));

  //     // Get metadata and sort by creation time
  //     const validItems = await this.getValidItemsWithMetadata(result.items);
  //     console.log('Valid items:', validItems.map(item => ({
  //       path: item.path,
  //       timeCreated: new Date(item.timeCreated)
  //     })));

  //     // Get and verify URLs
  //     const urls = await this.getValidUrls(validItems);
  //     console.log('Final valid URLs:', urls);

  //     // Update state
  //     this.updateUserImagesState(userId, urls);

  //   } catch (error) {
  //     console.error('Error loading user images:', error);
  //     throw error;
  //   } finally {
  //     this.loadingImages = false;
  //   }
  // }


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
      .sort((a, b) => b.timeCreated - a.timeCreated);
  }

  private async getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
    const urlPromises = validItems.map(async (item) => {
      try {
        const url = await getDownloadURL(item.ref);
        // Convert to proxied URL
        const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
        const exists = await this.verifyImageExists(proxiedUrl);
        if (!exists) {
          console.log('File not accessible:', item.path);
          this.imageLoadErrors.add(url);
          return null;
        }
        return proxiedUrl;
      } catch (error) {
        console.error('Error getting download URL for:', item.path, error);
        return null;
      }
    });

    return (await Promise.all(urlPromises)).filter((url): url is string => url !== null);
  }

  private updateUserImagesState(userId: string, urls: string[]) {
    const subject = this.getUserImagesSubject(userId);
    const currentUrl = subject.value.urls[subject.value.currentIndex];
    const newIndex = currentUrl ? urls.indexOf(currentUrl) : 0;

    subject.next({
      urls,
      currentIndex: newIndex >= 0 ? newIndex : 0
    });

    urls.forEach(url => this.imageLoadErrors.delete(url));
  }

  async verifyImageExists(url: string): Promise<boolean> {
    try {
      let fetchUrl = url;
      let fetchOptions: RequestInit = {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      };
  
      if (url.includes('firebasestorage.googleapis.com') || !url.startsWith('http')) {
        // Convert Firebase Storage URL to proxied URL
        const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
        
        if (!proxiedUrl) {
          console.warn('Failed to get proxied URL');
          return false;
        }
        fetchUrl = proxiedUrl;
      } else {
        // For non-Firebase URLs, set mode to 'no-cors'
        fetchOptions.mode = 'no-cors';
      }
  
      const response = await fetch(fetchUrl, fetchOptions);
  
      if (response.ok) {
        return true;
      } else if (response.status === 404) {
        console.warn('Image not found (404):', fetchUrl);
        return false;
      } else {
        console.error('Error fetching image:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Network error when fetching image:', error);
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

  private async checkImageLimit(userId: string) {
    const subject = this.getUserImagesSubject(userId);
    if (subject.value.urls.length >= this.MAX_IMAGES_PER_USER) {
      throw new Error(`Maximum of ${this.MAX_IMAGES_PER_USER} images allowed`);
    }
  }

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

  getCurrentImage(userId: string): Observable<string | null> {
    return this.getUserImagesSubject(userId).pipe(
      switchMap(async (state) => {
        const url = state.urls[state.currentIndex];
        if (!url) return null;
  
        if (url.includes('firebasestorage.googleapis.com')) {
          const convertedUrl = await this.storageService.convertFirebaseUrl(url);
          return convertedUrl;
        } else {
          return url;
        }
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
    this.navigateImage(userId, 1);
  }

  previousImage(userId: string): void {
    this.navigateImage(userId, -1);
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

