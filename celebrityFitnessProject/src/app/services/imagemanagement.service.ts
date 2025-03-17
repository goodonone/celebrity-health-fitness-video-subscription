import { Injectable } from '@angular/core';
import { storage, auth } from '../firebase.config';
import { ref, listAll, getDownloadURL, deleteObject, StorageReference, uploadBytesResumable, getMetadata } from 'firebase/storage';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
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
  private hasStartedNavigating = false;
  private preloadedImages = new Map<string, boolean>();
  private currentImageIndex = 0;
  private imageUrls: string[] = [];
  private selectedImagePath: string | null = null;
  private hasFirebaseImagesSubject = new BehaviorSubject<boolean>(false);
  hasFirebaseImages$ = this.hasFirebaseImagesSubject.asObservable();
  private firebaseImageCount = 0;
  private currentProfileImage: string | null = null;
  private convertedUrlCache = new Map<string, string>();

  constructor(
    private firebaseService: FirebaseService,
    private storageService: StorageService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  private cacheUrl(originalUrl: string, convertedUrl: string): void {
    this.convertedUrlCache.set(originalUrl, convertedUrl);
  }

  private getCachedUrl(originalUrl: string): string | undefined {
    return this.convertedUrlCache.get(originalUrl);
  }

  private clearUrlCache(): void {
    this.convertedUrlCache.clear();
  }

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
    console.log('Setting current profile image:', path);
    
    // Clear any temporary URL when setting profile image
    this.temporaryUrl = null;
    
    // Set current profile path
    this.currentProfilePath = this.getImagePath(path);
    console.log('Current profile path set to:', this.currentProfilePath);
  }

  setTemporaryUrl(url: string | null) {
    this.temporaryUrl = url;
    
    if (url) {
      const subject = this.getUserImagesSubject(this.userService.getUserId());
      const currentUrls = subject.value.urls;
      const newUrls = [url, ...currentUrls];
      
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

  // MAIN method 
  async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
    console.log('Starting loadUserImages');
    if (this.loadingImages) return;

    this.loadingImages = true;
    const subject = this.getUserImagesSubject(userId);

    try {
      // List files from Firebase
      const imagesRef = ref(storage, `profileImages/${userId}`);
      const result = await listAll(imagesRef);
      const validItems = await this.getValidItemsWithMetadata(result.items);
      let urls = await this.getValidUrls(validItems);

      console.log('Firebase images loaded:', urls);

      // Update hasFirebaseImages state
      this.firebaseImageCount = urls.length;
      this.hasFirebaseImagesSubject.next(urls.length > 0);

      // Convert Firebase URLs to API URLs
      urls = await Promise.all(
        urls.map(async (url) => {
          if (url.includes('firebasestorage.googleapis.com')) {
            return this.storageService.convertFirebaseUrl(url);
          }
          return url;
        })
      );

      // If we have a temporary URL in change picture state, add it at the front
      if (this.temporaryUrl && inChangePictureState) {
        urls = [this.temporaryUrl, ...urls.filter(u => u !== this.temporaryUrl)];
      }

      // Process and order URLs (sort firebase images, etc.)
      let finalUrls = this.processUrlArray(urls, userId);

      // Preload images to improve UX
      await Promise.all(finalUrls.map(url => this.preloadSingleImage(url)));

      // Set currentIndex
      const currentIndex = this.findCurrentImageIndex(finalUrls);

      subject.next({
        urls: finalUrls,
        currentIndex
      });

      console.log('Final URL array:', {
        urls: finalUrls,
        currentIndex,
        hasTemporaryUrl: !!this.temporaryUrl,
        firebaseImageCount: this.firebaseImageCount
      });

      console.log('All images loaded successfully');

    } catch (error) {
      console.error('Error loading user images:', error);
      this.firebaseImageCount = 0;
      this.hasFirebaseImagesSubject.next(false);
      subject.next({ urls: [], currentIndex: 0 });
    } finally {
      this.loadingImages = false;
    }
  }

  private async preloadSingleImage(url: string): Promise<void> {
    if (this.preloadedImages.has(url)) return; // Already preloaded

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        // Just a HEAD check might be enough, or actually fetch image:
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            this.preloadedImages.set(url, true);
            resolve('');
          };
          img.onerror = reject;
          img.src = url;
        });
      }
    } catch (error) {
      console.warn('Could not preload image', url, error);
    }
  }

  private findCurrentImageIndex(urls: string[]): number {
    if (!this.currentProfilePath || urls.length === 0) return 0;
    
    const normalizedProfilePath = this.normalizeUrl(this.currentProfilePath);
    const foundIndex = urls.findIndex(url =>
      this.normalizeUrl(this.getImagePath(url)) === normalizedProfilePath
    );
    
    return foundIndex !== -1 ? foundIndex : 0;
  }

  hasAnyFirebaseImages(): boolean {
    return this.firebaseImageCount > 0;
  }

  async checkAndUpdateFirebaseImageCount(userId: string): Promise<boolean> {
    try {
      const imagesRef = ref(storage, `profileImages/${userId}`);
      const result = await listAll(imagesRef);
      this.firebaseImageCount = result.items.length;
      this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
      return this.firebaseImageCount > 0;
    } catch (error) {
      console.error('Error checking Firebase images:', error);
      return false;
    }
  }

  async debugStorageContents(userId: string): Promise<void> {
    try {
      console.log(`Starting debug check for user: ${userId}`);
      
      // 1. Check direct Firebase storage path
      const imagesRef = ref(storage, `profileImages/${userId}`);
      const result = await listAll(imagesRef);
      
      console.log('Storage check results:', {
        path: `profileImages/${userId}`,
        itemCount: result.items.length,
        items: result.items.map(item => item.fullPath)
      });
      
      // 2. Check if our internal counters match
      console.log('Current image tracking state:', {
        firebaseImageCount: this.firebaseImageCount,
        hasFirebaseImagesFlag: this.hasFirebaseImagesSubject.getValue()
      });
      
      // 3. Check what URLs we have in the subject
      const subject = this.getUserImagesSubject(userId);
      console.log('Current URLs tracked:', {
        urlsCount: subject.value.urls.length,
        urls: subject.value.urls
      });
      
      // Update counters based on actual result
      this.firebaseImageCount = result.items.length;
      this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
      
      return;
    } catch (error) {
      console.error('Error in debug check:', error);
    }
  }

  async refreshFirebaseImageCount(userId: string): Promise<void> {
    try {
      const imagesRef = ref(storage, `profileImages/${userId}`);
      const result = await listAll(imagesRef);
      this.firebaseImageCount = result.items.length;
      this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
    } catch (error) {
      console.error('Error refreshing image count:', error);
      this.firebaseImageCount = 0;
      this.hasFirebaseImagesSubject.next(false);
    }
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

  // Check if a URL is an external web URL (not Firebase or API)
  isExternalUrl(url: string): boolean {
    if (!url) return false;
    
    // Not Firebase, API URLs, or local paths
    if (url.includes('firebasestorage.googleapis.com') || 
        url.includes('/api/storage/') ||
        url.startsWith('data:image/') ||
        url.startsWith('profileImages/') ||
        url.startsWith('blob:')) {
      return false;
    }
    
    try {
      new URL(url); // Validate it's a proper URL
      return true;  // It's an external URL if we got here
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
      .sort((a, b) => a.timeCreated - b.timeCreated); // Sort by creation time ascending
  }

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

  async initializeImagesCount(userId: string): Promise<void> {
    try {
      const imagesRef = ref(storage, `profileImages/${userId}`);
      const result = await listAll(imagesRef);
      this.firebaseImageCount = result.items.length;
      this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
    } catch (error) {
      console.error('Error initializing image count:', error);
      this.firebaseImageCount = 0;
      this.hasFirebaseImagesSubject.next(false);
    }
  }

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

  async getInitialImageCount(userId: string): Promise<{count: number}> {
    try {
      const imagesRef = ref(storage, `profileImages/${userId}`);
      const result = await listAll(imagesRef);
      
      return { count: result.items.length };
    } catch (error) {
      console.error('Error getting initial image count:', error);
      return { count: 0 };
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

  async deleteCurrentImage(userId: string): Promise<void> {
    const subject = this.getUserImagesSubject(userId);
    const current = subject.value;
    
    if (current.urls.length === 0) return;

    try {
      const currentUrl = current.urls[current.currentIndex];
      if (!currentUrl) {
        throw new Error('No current image URL found');
      }

      // Check if this is the currently set profile picture in the database
      const user = await firstValueFrom(this.userService.getUser(userId));
      const isCurrentProfilePicture = user.imgUrl && this.normalizeUrl(user.imgUrl) === this.normalizeUrl(currentUrl);

      // Handle blob URLs by getting the original path
      let urlToDelete = currentUrl;
      if (currentUrl.startsWith('blob:')) {
        const originalPath = await this.getOriginalPath(userId, current.currentIndex);
        if (originalPath) {
          urlToDelete = `${environment.apiUrl}/api/storage/${originalPath}`;
        } else {
          throw new Error('Could not determine original path for blob URL');
        }
      }

      // Remove the URL first to enable immediate UI update
      const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
      const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);

      // Delete the image if it's in Firebase storage
      if (!this.isExternalUrl(urlToDelete)) {
        try {
          await this.deleteImageByUrl(urlToDelete);
          this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
          this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
        } catch (deleteError) {
          console.error('Error deleting from storage:', deleteError);
        }
      }

      // Also clear temporary URL if this was it
      if (this.temporaryUrl === currentUrl) {
        this.temporaryUrl = null;
      }

      // Clear URL cache
      this.convertedUrlCache.clear();
      
      // Clear any other cache references
      this.preloadedImages.clear();

      // If this was the last image, reset state
      if (updatedUrls.length === 0) {
        this.resetToDefaultState(userId);
      } else {
        // Update the state with remaining URLs
        subject.next({
          urls: updatedUrls,
          currentIndex: Math.max(0, newIndex)
        });
      }

      // Reset position and zoom data after deletion
      this.resetImageTransformData(userId);

      // Refresh the image count explicitly
      this.refreshFirebaseImageCount(userId);

      // If we deleted the current profile picture, update the user record
      if (isCurrentProfilePicture) {
        const updatedUser = {
          ...user,
          imgUrl: null,
          profilePictureSettings: null
        };
        
        await firstValueFrom(this.userService.updateUser(updatedUser));
        console.log('User database record updated - profile picture removed');
      }

    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  private resetImageTransformData(userId: string): void {
    // Reset transform data in the service
    this.currentProfilePath = null;
    
    // Emit updated state through subject
    const subject = this.getUserImagesSubject(userId);
    const current = subject.value;
    
    if (current.urls.length > 0) {
      const nextUrl = current.urls[current.currentIndex];
      // Don't store zoom/position data for the next image
      subject.next({
        ...current,
        currentIndex: current.currentIndex
      });
    }
  }

  // Add this helper method
  private resetToDefaultState(userId: string): void {
    const subject = this.getUserImagesSubject(userId);
    subject.next({
      urls: [],
      currentIndex: 0
    });
    
    this.temporaryUrl = null;
    this.currentProfileImage = null;
    this.firebaseImageCount = 0;
    this.hasFirebaseImagesSubject.next(false);
    
    // Clear any cached URLs
    if (this.convertedUrlCache) {
      this.convertedUrlCache.clear();
    }
  }

  clearAllState(userId: string) {
    const subject = this.getUserImagesSubject(userId);
    subject.next({
      urls: [],
      currentIndex: 0
    });
    this.temporaryUrl = null;
    this.currentProfileImage = null;
    this.convertedUrlCache.clear();
    this.hasFirebaseImagesSubject.next(false);
  }

  resetAll(userId: string) {
    this.temporaryUrl = null;
    this.currentProfilePath = null;
    this.hasStartedNavigating = false;
    this.preloadedImages.clear();
    this.currentImageIndex = 0;
    this.imageUrls = [];
    this.selectedImagePath = null;
    this.hasFirebaseImagesSubject.next(false);
    this.firebaseImageCount = 0;
    this.currentProfileImage = null;
    this.convertedUrlCache.clear();

    // Reset subject to initial state
    const subject = this.getUserImagesSubject(userId);
    subject.next({
      urls: [],
      currentIndex: 0
    });
  }

  private async deleteImageByUrl(url: string) {
    try {
      if (!url) {
        throw new Error('No URL provided for deletion');
      }

      // Handle proxied URLs first
      if (url.includes('/api/storage/')) {
        const path = url.split('/api/storage/')[1];
        if (!path) {
          throw new Error('Invalid storage URL format');
        }
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
        return;
      }

      // Handle Firebase URLs
      if (url.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(url);
        const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]?.split('?')[0]);
        if (!path) {
          throw new Error('Invalid Firebase URL format');
        }
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
        return;
      }

      // Handle external URLs - don't need to delete anything in storage
      if (this.isExternalUrl(url)) {
        // No need to delete external URLs from storage
        return;
      }

      // Add this case after the external URL check
      if (url.startsWith('blob:')) {
        console.warn('Blob URL received in deleteImageByUrl - this should not happen');
        return;
      }

      // Handle direct paths
      if (url.startsWith('profileImages/') || url.startsWith('staging/')) {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
        return;
      }

      throw new Error('Unsupported URL format for deletion');

    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.log('File already deleted or does not exist');
        return;
      }
      console.error('Error in deleteImageByUrl:', error);
      throw error;
    }
  }

  // Helper method to safely extract path from URL
  private extractStoragePath(url: string): string | null {
    try {
      if (!url) return null;

        if (url.includes('/api/storage/')) {
          return url.split('/api/storage/')[1] || null;
        }
  
        if (url.includes('firebasestorage.googleapis.com')) {
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
          return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
        }
  
        if (url.startsWith('profileImages/') || url.startsWith('staging/')) {
          return url;
        }
  
        return null;
      } catch (error) {
        console.error('Error extracting storage path:', error);
        return null;
      }
}

  // private extractStoragePath(url: string): string | null {
//   try {
//     if (!url) return null;

//     if (url.includes('/api/storage/')) {
//       return url.split('/api/storage/')[1] || null;
//     }

//     if (url.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(url);
//       const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
//       return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
//     }

//     if (url.startsWith('profileImages/') || url.startsWith('staging/')) {
//       return url;
//     }

//     return null;
//   } catch (error) {
//     console.error('Error extracting storage path:', error);
//     return null;
//   }
// }
  
    getCurrentState(userId: string): {
      hasImages: boolean;
      currentUrl: string | null;
    } {
      const subject = this.getUserImagesSubject(userId);
      const current = subject.value;
      
      if (current.urls.length === 0) {
        return {
          hasImages: false,
          currentUrl: null
        };
      }
  
      // Pass userId to ensureValidUrls
      const validUrls = this.ensureValidUrls(current.urls, userId);
      const currentUrl = validUrls[current.currentIndex];
  
      return {
        hasImages: true,
        currentUrl
      };
    }
  
    private ensureValidUrls(urls: string[], userId: string): string[] {
      return urls.map(url => {
        if (url.startsWith('blob:')) {
          const pathMatch = url.match(/\/([^/]+)$/);
          if (pathMatch) {
            return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
          }
        }
        return url;
      });
    }
  
    // URL Management and Validation
    async checkAndUpdateImageUrl(userId: string, url: string): Promise<string | null> {
      if (!url) return null;
      
      try {
        const exists = await this.verifyImageExists(url);
        if (!exists) {
          this.imageLoadErrors.add(url);
          await this.loadUserImages(userId, false);
          return null;
        }
        return url;
      } catch (error) {
        console.error('Error checking image:', error);
        this.imageLoadErrors.add(url);
        return null;
      }
    }
  
    private convertToApiUrl(url: string, userId: string): string {
      if (url.startsWith('blob:')) {
        const pathMatch = url.match(/\/([^/]+)$/);
        if (pathMatch) {
          return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
        }
      }
  
      if (url.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(url);
        const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
        return `${environment.apiUrl}/api/storage/${path}`;
      }
  
      return url;
    }
  
    getCurrentImage(userId: string): Observable<string | null> {
      return this.getUserImagesSubject(userId).pipe(
        switchMap(async state => {
          if (state.urls.length === 0) return null;
          
          const currentUrl = state.urls[state.currentIndex];
          if (!currentUrl) return null;
  
          // Check cache first
          const cachedUrl = this.getCachedUrl(currentUrl);
          if (cachedUrl) return cachedUrl;
  
          try {
            // Handle Firebase URLs
            if (currentUrl.includes('firebasestorage.googleapis.com')) {
              const convertedUrl = await this.storageService.convertFirebaseUrl(currentUrl);
              if (convertedUrl) {
                this.cacheUrl(currentUrl, convertedUrl);
                return convertedUrl;
              }
            }
  
            return currentUrl;
          } catch (error) {
            console.error('Error getting current image:', error);
            return null;
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
  
    private processUrlArray(urls: string[], userId: string): string[] {
      // Normalize all URLs
      const normalizedUrls = urls.map(url => {
        if (url.startsWith('blob:')) {
          const pathMatch = url.match(/\/([^/]+)$/);
          if (pathMatch) {
            return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
          }
        }
        return url;
      });
  
      // If there's a temporary URL, it takes highest priority
      if (this.temporaryUrl) {
        const otherUrls = normalizedUrls.filter(url => url !== this.temporaryUrl);
        return [this.temporaryUrl, ...otherUrls];
      }
  
      // Sort storage URLs by timestamp
      return normalizedUrls.sort((a, b) => {
        // Only sort URLs that have timestamps
        const getTimestamp = (u: string) => {
          const match = u.match(/\/(\d+)-/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getTimestamp(a) - getTimestamp(b);
      });
    }
  
    private async verifyImageUrl(url: string): Promise<boolean> {
      try {
        const headers = url.includes('/api/storage/') ?
          await this.storageService.getAuthHeaders() :
          undefined;
  
        const response = await fetch(url, {
          method: 'HEAD',
          headers
        });
  
        return response.ok;
      } catch (error) {
        console.error('Error verifying image URL:', error);
        return false;
      }
    }
  
    nextImage(userId: string): void {
      const subject = this.getUserImagesSubject(userId);
      const current = subject.value;
      
      if (current.urls.length <= 1) return;
      
      let newIndex = (current.currentIndex + 1) % current.urls.length;
      
      this.hasStartedNavigating = true;
  
      subject.next({
        urls: current.urls,
        currentIndex: newIndex
      });
    }
  
    private ensureValidIndex(index: number, urls: string[]): number {
      if (urls.length === 0) return 0;
      return Math.max(0, Math.min(index, urls.length - 1));
    }
  
    previousImage(userId: string): void {
      const subject = this.getUserImagesSubject(userId);
      const current = subject.value;
  
      if (current.urls.length <= 1) return;
      
      let newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  
      this.hasStartedNavigating = true;
  
      subject.next({
        urls: current.urls,
        currentIndex: newIndex
      });
    }
  
    logNavigationState(userId: string): void {
      const subject = this.getUserImagesSubject(userId);
      const current = subject.value;
      
      console.log('Current Navigation State:', {
        urls: current.urls,
        currentIndex: current.currentIndex,
        hasTemporaryUrl: !!this.temporaryUrl,
        hasStartedNavigating: this.hasStartedNavigating
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
  
    async checkProfileImageExists(imgUrl: string | null): Promise<boolean> {
      if (!imgUrl) return false;
  
      try {
        // Check based on URL type
        if (imgUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const imageRef = ref(storage, this.getImagePath(imgUrl));
            await getDownloadURL(imageRef);
            return true;
          } catch {
            return false;
          }
        }
  
        // For API URLs, verify using the storage service
        if (imgUrl.includes('/api/storage/')) {
          try {
            const headers = await this.storageService.getAuthHeaders();
            const response = await fetch(imgUrl, {
              method: 'HEAD',
              headers
            });
            return response.ok;
          } catch {
            return false;
          }
        }
  
        // For direct storage paths
        if (imgUrl.startsWith('profileImages/')) {
          try {
            const imageRef = ref(storage, imgUrl);
            await getDownloadURL(imageRef);
            return true;
          } catch {
            return false;
          }
        }
  
        // For any other URLs, try a basic fetch
        try {
          const response = await fetch(imgUrl, { method: 'HEAD' });
          return response.ok;
        } catch {
          return false;
        }
  
      } catch (error) {
        console.error('Error checking if profile image exists:', error);
        return false;
      }
    }
  
    hasProfileImageInStorage(userId: string): boolean {
      // Get the current state of user images
      const subject = this.getUserImagesSubject(userId);
      const state = subject.value;
  
      // If there are no images at all, return false
      if (state.urls.length === 0) return false;
  
      // If there's no current profile path, return false
      if (!this.currentProfilePath) return false;
  
      // For Firebase/storage URLs, normalize both URLs before comparing
      const normalizedProfilePath = this.normalizeUrl(this.currentProfilePath);
      return state.urls.some(url => this.normalizeUrl(url) === normalizedProfilePath);
    }
  
    // Get the next state after an image is deleted
    async getNextState(userId: string): Promise<{
      hasImages: boolean;
      currentUrl: string | null;
      nextIndex: number;
      nextUrl: string | null;
    }> {
      const subject = this.getUserImagesSubject(userId);
      const current = subject.value;
  
      // If no images, return empty state
      if (current.urls.length === 0) {
        return {
          hasImages: false,
          currentUrl: null,
          nextIndex: 0,
          nextUrl: null
        };
      }
  
      // If only one image, return current state
      if (current.urls.length === 1) {
        return {
          hasImages: true,
          currentUrl: current.urls[0],
          nextIndex: 0,
          nextUrl: current.urls[0]
        };
      }
  
      // Calculate next index
      let nextIndex = current.currentIndex;
      const tempUrls = [...current.urls];
  
      // Remove current URL from array
      tempUrls.splice(current.currentIndex, 1);
  
      // If we removed the last image in the array, adjust the index
      if (nextIndex >= tempUrls.length) {
        nextIndex = 0;
      }
  
      // Get next URL from temporary array
      const nextUrl = tempUrls[nextIndex] || null;
  
      // Return new state
      return {
        hasImages: tempUrls.length > 0,
        currentUrl: current.urls[current.currentIndex], 
        nextIndex: nextIndex,
        nextUrl: nextUrl
      };
    }
  }