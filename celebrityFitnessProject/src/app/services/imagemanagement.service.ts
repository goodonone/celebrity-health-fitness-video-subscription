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

// setCurrentProfileImage(path: string) {
//   this.currentProfilePath = this.getImagePath(path);
//   console.log('Set current profile path:', this.currentProfilePath);
// }

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
  // setTemporaryUrl(url: string | null) {
  //   this.temporaryUrl = url;
  //   console.log('Temporary URL set:', url);
  // }

  // setTemporaryUrl(url: string | null) {
  //   this.temporaryUrl = url;
  //   // Immediately trigger a reload of images to update the order
  //   if (url) {
  //     const subject = this.getUserImagesSubject(this.userService.getUserId());
  //     const currentUrls = subject.value.urls;
      
  //     // Put temporary URL first, then the rest of the existing URLs
  //     // const newUrls = [url, ...currentUrls.filter(u => u !== url)];
  //     const newUrls = [url, ...currentUrls.filter(u => !this.isProviderUrl(u))];
      
  //     subject.next({
  //       urls: newUrls,
  //       currentIndex: 0
  //     });
  //   }
  //   console.log('Temporary URL set and navigation updated:', url);
  // }

// setTemporaryUrl(url: string | null) {
//   this.temporaryUrl = url;
//   // If setting a new temporary URL, add it to the navigation
//   if (url) {
//     const subject = this.getUserImagesSubject(this.userService.getUserId());
//     const currentUrls = subject.value.urls;
    
//     // Filter out any other provider URLs and put new one at front
//     const firebaseUrls = currentUrls.filter(u => !this.isProviderUrl(u));
//     const newUrls = [url, ...firebaseUrls];
    
//     subject.next({
//       urls: newUrls,
//       currentIndex: 0  // Set to 0 to select the temporary URL
//     });
//     console.log('Navigation updated with temporary URL:', {
//       temporaryUrl: url,
//       totalUrls: newUrls.length
//     });
//   }
// }

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
  
  
  // setTemporaryUrl(url: string | null) {
  //   this.temporaryUrl = url;
  //   console.log('Temporary URL set:', url);
    
  //   // If we have a userId, reload the images to include temporary URL
  //   const userId = this.getCurrentUserId();
  //   if (userId) {
  //     this.loadUserImages(userId);
  //   }
  // }

  // Helper method to get current user ID
  // private getCurrentUserId(): string {
  //   // Implement based on your user management system
  //   // This could come from a service or stored value
  //   this.userService.getUserId();
  //   return this.userId || '';
  // }
  
  clearTemporaryUrl() {
    this.temporaryUrl = null;
  }

  // Image Loading and Verification
  // async loadUserImages(userId: string): Promise<void> {
  //   if (this.loadingImages) {
  //     console.log('Already loading images, skipping...');
  //     return;
  //   }

  //   console.log('Loading user images for:', userId);
  
  //   this.loadingImages = true;
  //   const imagesRef = ref(storage, `profileImages/${userId}`);
  
  //   try {
  //     const result = await listAll(imagesRef);
  //     console.log('Initial file list:', result.items.map(item => item.fullPath));
  
  //     const validItems = await this.getValidItemsWithMetadata(result.items);
  //     console.log('Valid items:', validItems.map(item => ({
  //       path: item.path,
  //       timeCreated: new Date(item.timeCreated)
  //     })));
  
  //     const urls = await this.getValidUrls(validItems);
  //     console.log('Final valid URLs:', urls);
  
  //     this.updateUserImagesState(userId, urls);
  
  //   } catch (error) {
  //     console.error('Error loading user images:', error);
  //     throw error;
  //   } finally {
  //     this.loadingImages = false;
  //   }
  // }
  // async loadUserImages(userId: string): Promise<void> {
  //   console.log('Loading user images for:', userId);
  //   const imagesRef = ref(storage, `profileImages/${userId}`);
    
  //   try {
  //     const result = await listAll(imagesRef);
  //     console.log('Files found in storage:', {
  //       count: result.items.length,
  //       files: result.items.map(item => item.fullPath)
  //     });
      
  //     const validItems = await this.getValidItemsWithMetadata(result.items);
  //     console.log('Valid items after metadata check:', {
  //       count: validItems.length,
  //       items: validItems.map(item => item.path)
  //     });
      
  //     const urls = await this.getValidUrls(validItems);
  //     console.log('Final valid URLs:', {
  //       count: urls.length,
  //       urls
  //     });
      
  //     this.updateUserImagesState(userId, urls);
  //   } catch (error) {
  //     console.error('Error loading user images:', error);
  //     throw error;
  //   }
  // }

  // async loadUserImages(userId: string): Promise<void> {
  //   console.log('Loading user images for:', userId);
  //   if (this.loadingImages) {
  //     console.log('Already loading images, skipping...');
  //     return;
  //   }
  
  //   this.loadingImages = true;
  //   const imagesRef = ref(storage, `profileImages/${userId}`);
  
  //   try {
  //     // List all files in the folder
  //     const result = await listAll(imagesRef);
  //     console.log('Files found in Firebase:', {
  //       count: result.items.length,
  //       paths: result.items.map(item => item.fullPath)
  //     });
  
  //     if (result.items.length > 1) {
  //       console.log('Multiple images found, showing navigation should be true');
  //     }
  
  //     // Get metadata and validate items
  //     const validItems = await this.getValidItemsWithMetadata(result.items);
  //     console.log('Valid items after metadata check:', validItems.length);
  
  //     // Convert to URLs
  //     const urls = await this.getValidUrls(validItems);
  //     console.log('Final valid URLs:', urls.length);
  
  //     // Update state
  //     this.updateUserImagesState(userId, urls);
  
  //   } catch (error) {
  //     console.error('Error loading user images:', error);
  //     throw error;
  //   } finally {
  //     this.loadingImages = false;
  //   }
  // }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Force showing navigation if more than one file exists
//     if (result.items.length > 1) {
//       console.log('Multiple images found, showing navigation should be true');
//     }

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     const urls = await this.getValidUrls(validItems);
//     console.log('Final valid URLs:', urls.length);

//     // Update state with at least one URL
//     if (urls.length > 0) {
//       this.updateUserImagesState(userId, urls);
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // If we have valid URLs, order them so the current image is first
//     if (urls.length > 0) {
//       const subject = this.getUserImagesSubject(userId);
//       const currentState = subject.value;
//       const currentImage = currentState.urls[currentState.currentIndex];

//       if (currentImage) {
//         // Find the current image in the new URLs array
//         const currentImageIndex = urls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(currentImage)
//         );

//         // If found and not already first, move it to the front
//         if (currentImageIndex > 0) {
//           const [current] = urls.splice(currentImageIndex, 1);
//           urls.unshift(current);
//           console.log('Reordered URLs to maintain current image first:', urls);
//         }
//       }

//       // Update state with reordered URLs
//       this.updateUserImagesState(userId, urls);
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     const validItems = await this.getValidItemsWithMetadata(result.items);
    
//     // Get URLs from Firebase
//     const urls = await this.getValidUrls(validItems);
    
//     if (urls.length > 0) {
//       // Reorder URLs to put current profile picture first
//       const subject = this.getUserImagesSubject(userId);
//       const currentState = subject.value;
      
//       // Find current profile picture URL
//       const currentProfileImage = subject.value.urls[0] || currentState.urls[currentState.currentIndex];
      
//       if (currentProfileImage) {
//         // Remove current profile image from array if it exists
//         const otherUrls = urls.filter(url => 
//           this.normalizeUrl(url) !== this.normalizeUrl(currentProfileImage)
//         );
        
//         // Create final array with temporary URL (if exists) first, 
//         // then current profile picture, then other images
//         const orderedUrls = [
//           ...(this.temporaryUrl ? [this.temporaryUrl] : []),
//           currentProfileImage,
//           ...otherUrls
//         ];

//         console.log('Reordered URLs:', {
//           temporaryUrl: this.temporaryUrl,
//           currentProfile: currentProfileImage,
//           finalOrder: orderedUrls
//         });

//         this.updateUserImagesState(userId, orderedUrls);
//       }
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }



// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // If we have valid URLs, handle ordering
//     if (urls.length > 0) {
//       const subject = this.getUserImagesSubject(userId);
//       const currentState = subject.value;
//       const currentImage = currentState.urls[currentState.currentIndex];

//       if (currentImage) {
//         // Find the current image in the new URLs array
//         const currentImageIndex = urls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(currentImage)
//         );

//         // If found and not already first, move it to the front
//         if (currentImageIndex > 0) {
//           const [current] = urls.splice(currentImageIndex, 1);
//           urls.unshift(current);
//           console.log('Reordered URLs to maintain current image first:', urls);
//         }
//       }

//       // Handle temporary URL if it exists
//       if (this.temporaryUrl) {
//         urls = [this.temporaryUrl, ...urls];
//         console.log('Added temporary URL to front:', urls);
//       }

//       // Update state with final URL array
//       this.updateUserImagesState(userId, urls);
//       console.log('Final URL array:', urls);
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }


// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // If we have valid URLs, handle ordering
//     if (urls.length > 0) {
//       const subject = this.getUserImagesSubject(userId);
//       const currentState = subject.value;
//       const currentImage = currentState.urls[currentState.currentIndex];

//       // Check if current profile image is from a provider (like Unsplash)
//       if (currentImage && this.isProviderUrl(currentImage)) {
//         console.log('Current image is a provider URL:', currentImage);
//         // Set it as temporary URL to ensure it appears first
//         this.temporaryUrl = currentImage;
//         // Remove it from Firebase URLs if it somehow got in there
//         urls = urls.filter(url => url !== currentImage);
//       } else if (currentImage) {
//         // Handle Firebase stored image ordering
//         const currentImageIndex = urls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(currentImage)
//         );

//         if (currentImageIndex > 0) {
//           const [current] = urls.splice(currentImageIndex, 1);
//           urls.unshift(current);
//           console.log('Reordered URLs to maintain current image first:', urls);
//         }
//       }

//       // Handle temporary URL if it exists
//       if (this.temporaryUrl) {
//         urls = [this.temporaryUrl, ...urls];
//         console.log('Added temporary URL to front:', urls);
//       }

//       // Update state with final URL array
//       this.updateUserImagesState(userId, urls);
//       console.log('Final URL array:', urls);
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// // }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // If we have valid URLs, handle ordering
//     if (urls.length > 0) {
//       const subject = this.getUserImagesSubject(userId);
//       const currentState = subject.value;
      
//       // Get the current profile image URL (whether it's firebase or provider)
//       const currentProfileImage = currentState.urls[currentState.currentIndex];
//       console.log('Current profile image:', currentProfileImage);

//       if (currentProfileImage) {
//         if (this.isProviderUrl(currentProfileImage)) {
//           // Handle provider URL
//           this.temporaryUrl = currentProfileImage;
//           urls = [currentProfileImage, ...urls];
//         } else {
//           // Handle Firebase image
//           // Find and move current profile image to front
//           const currentImageIndex = urls.findIndex(url => 
//             this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//           );
          
//           console.log('Current image index:', currentImageIndex);

//           if (currentImageIndex !== -1) {
//             // Remove current image from its position
//             const [current] = urls.splice(currentImageIndex, 1);
//             // Add it to the front
//             urls.unshift(current);
//             console.log('Reordered URLs to maintain current image first:', urls);
//           }
//         }
//       }

//       // Handle any new temporary URL if it exists and is different from current
//       if (this.temporaryUrl && !urls.includes(this.temporaryUrl)) {
//         urls = [this.temporaryUrl, ...urls];
//         console.log('Added new temporary URL to front:', urls);
//       }

//       // Update state with final URL array
//       this.updateUserImagesState(userId, urls);
//       console.log('Final URL array:', urls);
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }


// Working
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // Get the current state before loading new images
//     const subject = this.getUserImagesSubject(userId);
//     const currentState = subject.value;
//     const currentProfileImage = currentState.urls[currentState.currentIndex];
//     console.log('Current profile image before loading:', currentProfileImage);

//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // Reorder URLs to maintain current image first
//     if (urls.length > 0 && currentProfileImage) {
//       // Remove current profile image from the array if it exists
//       urls = urls.filter(url => this.normalizeUrl(url) !== this.normalizeUrl(currentProfileImage));
      
//       // Add current profile image to the front
//       urls = [currentProfileImage, ...urls];
      
//       console.log('Reordered URLs with current profile first:', urls);
//     }

//     // If we have a temporary URL that's different from current profile image,
//     // add it to the front
//     if (this.temporaryUrl && this.temporaryUrl !== currentProfileImage) {
//       urls = [this.temporaryUrl, ...urls];
//       console.log('Added temporary URL to front:', urls);
//     }

//     // Update state while maintaining the current image
//     this.updateUserImagesState(userId, urls, currentProfileImage);

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // Get the current state before loading new images
//     const subject = this.getUserImagesSubject(userId);
//     const currentState = subject.value;
//     const currentProfileImage = currentState.urls[currentState.currentIndex];
//     console.log('Current profile image before loading:', currentProfileImage);

//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     if (currentProfileImage) {
//       if (this.isProviderUrl(currentProfileImage)) {
//         // For provider URLs (Unsplash), add it to the front
//         // and maintain original order of Firebase images
//         urls = [currentProfileImage, ...urls];
//       } else {
//         // For Firebase images, find its original index and maintain order
//         const currentIndex = urls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//         );
//         console.log('Current Firebase image index:', currentIndex);

//         if (currentIndex !== -1) {
//           // Already in correct position, no need to reorder
//           // This maintains original order for navigation
//         }
//       }
//     }

//     // Update state with proper index
//     const updatedIndex = currentProfileImage ? urls.findIndex(url => 
//       this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//     ) : 0;

//     console.log('Final state:', {
//       urls,
//       currentIndex: updatedIndex,
//       isProvider: currentProfileImage ? this.isProviderUrl(currentProfileImage) : false
//     });

//     subject.next({
//       urls,
//       currentIndex: Math.max(0, updatedIndex)
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // Get the current state before loading new images
//     const subject = this.getUserImagesSubject(userId);
//     const currentState = subject.value;
//     const currentProfileImage = currentState.urls[currentState.currentIndex];
//     console.log('Current profile image before loading:', currentProfileImage);

//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items in chronological order
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs, maintaining chronological order
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     if (currentProfileImage) {
//       if (this.isProviderUrl(currentProfileImage)) {
//         // For provider URLs (Unsplash), add it to the front
//         // and maintain original chronological order of Firebase images
//         urls = [currentProfileImage, ...urls];
//       } else {
//         // For Firebase images, maintain the original position in chronological order
//         const currentIndex = urls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//         );
//         if (currentIndex !== -1) {
//           // Keep the current position, order is already correct
//           console.log('Current Firebase image index:', currentIndex);
//         }
//       }
//     }

//     // Update state with proper index
//     const updatedIndex = currentProfileImage ? urls.findIndex(url => 
//       this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//     ) : 0;

//     console.log('Final state:', {
//       urls,
//       currentIndex: updatedIndex,
//       isProvider: currentProfileImage ? this.isProviderUrl(currentProfileImage) : false
//     });

//     subject.next({
//       urls,
//       currentIndex: Math.max(0, updatedIndex)
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// Working
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // Get the current state before loading new images
//     const subject = this.getUserImagesSubject(userId);
//     const currentState = subject.value;
//     const currentProfileImage = currentState.urls[currentState.currentIndex];
//     console.log('Current profile image before loading:', currentProfileImage);

//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // Reorder URLs if needed
//     if (urls.length > 0 && currentProfileImage) {
//       if (this.isProviderUrl(currentProfileImage)) {
//         // For provider URLs (Unsplash), add it to the front
//         urls = [currentProfileImage, ...urls];
//       }
//     }

//     // Find the correct index for the current image
//     let currentIndex = 0;
//     if (currentProfileImage) {
//       currentIndex = urls.findIndex(url => 
//         this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//       );
//       if (currentIndex === -1) currentIndex = 0;
//     }

//     console.log('Final state:', {
//       urls,
//       currentIndex,
//       isProvider: currentProfileImage ? this.isProviderUrl(currentProfileImage) : false
//     });

//     // Update state while maintaining the current image position
//     subject.next({
//       urls,
//       currentIndex
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // Get current state with the already-set current index
//     const currentState = subject.value;
//     const currentProfileUrl = currentState.urls[currentState.currentIndex];
//     console.log('Current profile image in load:', currentProfileUrl);

//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     console.log('Initial URLs array:', urls);

//     if (currentProfileUrl) {
//       // Find current profile image in new list
//       const normalizedCurrent = this.normalizeUrl(currentProfileUrl);
//       const profileIndex = urls.findIndex(url => 
//         this.normalizeUrl(url) === normalizedCurrent
//       );

//       if (profileIndex !== -1) {
//         console.log('Found current profile image at index:', profileIndex);
//         // Keep the current index from the state if it matches
//         subject.next({
//           urls,
//           currentIndex: profileIndex
//         });
//       } else {
//         console.log('Profile image not found in list, keeping current index');
//         // If image not found, maintain current index if valid
//         const validIndex = Math.min(currentState.currentIndex, urls.length - 1);
//         subject.next({
//           urls,
//           currentIndex: Math.max(0, validIndex)
//         });
//       }
//     } else {
//       console.log('No current profile image set, using first image');
//       subject.next({
//         urls,
//         currentIndex: 0
//       });
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }


// working 
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

//     if (this.currentProfilePath) {
//       // Find current profile image in new list
//       const currentIndex = urls.findIndex(url => 
//         this.getImagePath(url) === this.currentProfilePath
//       );

//       if (currentIndex !== -1) {
//         console.log('Found current profile image at index:', currentIndex);
//         subject.next({
//           urls,
//           currentIndex
//         });
//       }
//     } else {
//       console.log('No current profile path set');
//       subject.next({
//         urls,
//         currentIndex: 0
//       });
//     }

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// working
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

//     // If there's a temporary URL, it should be first
//     if (this.temporaryUrl) {
//       urls = [this.temporaryUrl, ...urls];
//     }

//     // Then find the current profile image if it exists
//     if (this.currentProfilePath) {
//       // Only look in the Firebase URLs (skip temporary URL if it exists)
//       const startIndex = this.temporaryUrl ? 1 : 0;
//       const firebaseUrls = urls.slice(startIndex);
//       const currentIndex = firebaseUrls.findIndex(url => 
//         this.getImagePath(url) === this.currentProfilePath
//       );

//       if (currentIndex !== -1) {
//         // Need to adjust index if we have a temporary URL
//         const adjustedIndex = startIndex + currentIndex;
//         console.log('Found current profile image at index:', adjustedIndex);
//         subject.next({
//           urls,
//           currentIndex: adjustedIndex
//         });
//         return;
//       }
//     }

//     // If no profile image found or no profile path set
//     console.log('Using default ordering');
//     subject.next({
//       urls,
//       currentIndex: 0
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

// latest working
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

//     // If there's a temporary URL, it should always be first and selected
//     if (this.temporaryUrl) {
//       urls = [this.temporaryUrl, ...urls];
//       console.log('Added temporary URL at index 0:', {
//         temporaryUrl: this.temporaryUrl,
//         totalUrls: urls.length
//       });
//       subject.next({
//         urls,
//         currentIndex: 0  // Always select temporary URL when it exists
//       });
//       return;
//     }

//     // Only look for current profile image if there's no temporary URL
//     if (this.currentProfilePath) {
//       const currentIndex = urls.findIndex(url => 
//         this.getImagePath(url) === this.currentProfilePath
//       );

//       if (currentIndex !== -1) {
//         console.log('Found current profile image at index:', currentIndex);
//         subject.next({
//           urls,
//           currentIndex
//         });
//         return;
//       }
//     }

//     // If no profile image found or no profile path set
//     console.log('Using default ordering');
//     subject.next({
//       urls,
//       currentIndex: 0
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
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

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // Get the current state before loading new images
//     const subject = this.getUserImagesSubject(userId);
//     const currentState = subject.value;
//     const currentProfileImage = currentState.urls[0]; // Profile picture is always first
//     console.log('Current profile image:', currentProfileImage);

//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // Reorder URLs if needed
//     if (urls.length > 0 && currentProfileImage) {
//       if (this.isProviderUrl(currentProfileImage)) {
//         // For provider URLs (Unsplash), add it to the front
//         urls = [currentProfileImage, ...urls];
//       }
//     }

//     // Find the correct index for the current image
//     let currentIndex = 0;
//     if (currentProfileImage) {
//       currentIndex = urls.findIndex(url => 
//         this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//       );
//       if (currentIndex === -1) currentIndex = 0;
//     }

//     console.log('Final state:', {
//       urls,
//       currentIndex,
//       isProvider: currentProfileImage ? this.isProviderUrl(currentProfileImage) : false
//     });

//     // Update state while maintaining the current image position
//     subject.next({
//       urls,
//       currentIndex
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }


// async loadUserImages(userId: string): Promise<void> {
//   console.log('Loading user images for:', userId);
//   if (this.loadingImages) {
//     console.log('Already loading images, skipping...');
//     return;
//   }

//   this.loadingImages = true;
//   const imagesRef = ref(storage, `profileImages/${userId}`);

//   try {
//     // Get the current state before loading new images
//     const subject = this.getUserImagesSubject(userId);
//     const currentState = subject.value;
//     const currentProfileImage = currentState.urls[currentState.currentIndex];
//     console.log('Current profile image before loading:', currentProfileImage);

//     // List all files in the folder
//     const result = await listAll(imagesRef);
//     console.log('Files found in Firebase:', {
//       count: result.items.length,
//       paths: result.items.map(item => item.fullPath)
//     });

//     // Get metadata and validate items
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     console.log('Valid items after metadata check:', validItems.length);

//     // Get and validate URLs
//     let urls = await this.getValidUrls(validItems);
//     console.log('Initial URLs array:', urls);

//     // Store the current index before any modifications
//     let finalIndex = 0;

//     if (currentProfileImage) {
//       if (this.isProviderUrl(currentProfileImage)) {
//         // For provider URLs (Unsplash), add it to the front
//         // and maintain original order of Firebase images
//         urls = [currentProfileImage, ...urls];
//         finalIndex = 0;
//       } else {
//         // For Firebase images, find its original index and maintain order
//         finalIndex = urls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(currentProfileImage)
//         );
//         console.log('Current Firebase image index:', finalIndex);

//         if (finalIndex === -1) {
//           finalIndex = 0;
//         }
//       }
//     }

//     console.log('Final state:', {
//       urls,
//       currentIndex: finalIndex,
//       isProvider: currentProfileImage ? this.isProviderUrl(currentProfileImage) : false
//     });

//     // Update state using the stored index
//     subject.next({
//       urls,
//       currentIndex: finalIndex
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//   } finally {
//     this.loadingImages = false;
//   }
// }

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

// Helper method to normalize URLs for comparison
// private normalizeUrl(url: string): string {
//   // Remove any API or Firebase storage prefixes
//   return url.replace(/^.*?(profileImages\/)/, 'profileImages/');
// }

// private normalizeUrl(url: string): string {
//   // Remove any protocol, domain, and storage prefix to compare just the paths
//   return url.replace(/^.*?(profileImages\/|https?:\/\/)/, '');
// }

// normalizeUrl(url: string): string {
//   if (!url) return '';
  
//   try {
//     return url
//       .replace(/^https?:\/\//, '')  // Remove protocol
//       .replace(/[^/]+\//, '')       // Remove domain
//       .replace(/^.*?(profileImages\/)/, 'profileImages/') // Normalize storage path
//       .replace(/\?.*$/, '');        // Remove query parameters
//   } catch (error) {
//     console.error('Error normalizing URL:', error);
//     return url;
//   }
// }

// getCurrentProfileImage(userId: string): string | null {
//   const subject = this.getUserImagesSubject(userId);
//   const state = subject.value;
//   return state.urls[state.currentIndex] || null;
// }

//   private async getValidItemsWithMetadata(items: StorageReference[]) {
//     const itemsWithMetadata = await Promise.all(
//       items.map(async (item) => {
//         try {
//           const metadata = await getMetadata(item);
//           return {
//             ref: item,
//             metadata,
//             path: item.fullPath,
//             timeCreated: new Date(metadata.timeCreated).getTime()
//           };
//         } catch (error) {
//           console.error('Error getting metadata for:', item.fullPath, error);
//           return null;
//         }
//       })
//     );

//     return itemsWithMetadata
//       .filter((item): item is NonNullable<typeof item> => item !== null)
//       .sort((a, b) => b.timeCreated - a.timeCreated);
//   }

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

  // private async getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
  //   const urlPromises = validItems.map(async (item) => {
  //     try {
  //       const url = await getDownloadURL(item.ref);
  //       // Convert to proxied URL
  //       const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
  //       const exists = await this.verifyImageExists(proxiedUrl);
  //       if (!exists) {
  //         console.log('File not accessible:', item.path);
  //         this.imageLoadErrors.add(url);
  //         return null;
  //       }
  //       return proxiedUrl;
  //     } catch (error) {
  //       console.error('Error getting download URL for:', item.path, error);
  //       return null;
  //     }
  //   });

  //   return (await Promise.all(urlPromises)).filter((url): url is string => url !== null);
  // }

  // private async getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
  //   console.log('Getting URLs for items:', validItems.map(item => item.path));
    
  //   const urlPromises = validItems.map(async (item) => {
  //     try {
  //       // Get Firebase download URL
  //       const firebaseUrl = await getDownloadURL(item.ref);
  //       console.log('Got Firebase URL:', firebaseUrl);
  
  //       // Convert to proxied URL
  //       const proxiedUrl = await this.storageService.convertFirebaseUrl(firebaseUrl);
  //       console.log('Converted to proxied URL:', proxiedUrl);
  
  //       const exists = await this.verifyImageExists(proxiedUrl);
  //       console.log('Image verification result:', {
  //         path: item.path,
  //         exists
  //       });
  
  //       if (!exists) {
  //         console.warn('File not accessible:', item.path);
  //         return null;
  //       }
  
  //       return proxiedUrl;
  //     } catch (error) {
  //       console.error('Error getting download URL for:', item.path, error);
  //       return null;
  //     }
  //   });
  
  //   const urls = (await Promise.all(urlPromises)).filter((url): url is string => url !== null);
  //   console.log('Final valid URLs:', {
  //     count: urls.length,
  //     urls
  //   });
  
  //   return urls;
  // }

  // private async getValidUrls(validItems: Array<{ ref: StorageReference; path: string }>) {
  //   console.log('Getting URLs for items:', validItems.map(item => item.path));
    
  //   // Get URLs from Firebase
  //   const firebaseUrls = await Promise.all(
  //     validItems.map(async (item) => {
  //       try {
  //         const url = await getDownloadURL(item.ref);
  //         const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
  //         const exists = await this.verifyImageExists(proxiedUrl);
  //         if (!exists) {
  //           console.warn('File not accessible:', item.path);
  //           return null;
  //         }
  //         return proxiedUrl;
  //       } catch (error) {
  //         console.error('Error getting download URL for:', item.path, error);
  //         return null;
  //       }
  //     })
  //   );
  
  //   // Filter out nulls and combine with temporary URL if it exists
  //   const validUrls = firebaseUrls.filter((url): url is string => url !== null);
    
  //   if (this.temporaryUrl) {
  //     console.log('Adding temporary URL to navigation:', this.temporaryUrl);
  //     return [this.temporaryUrl, ...validUrls];
  //   }
  
  //   return validUrls;
  // }

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

  // private updateUserImagesState(userId: string, urls: string[]) {
  //   const subject = this.getUserImagesSubject(userId);
  //   const currentUrl = subject.value.urls[subject.value.currentIndex];
  //   const newIndex = currentUrl ? urls.indexOf(currentUrl) : 0;

  //   subject.next({
  //     urls,
  //     currentIndex: newIndex >= 0 ? newIndex : 0
  //   });

  //   urls.forEach(url => this.imageLoadErrors.delete(url));
  // }
  // private updateUserImagesState(userId: string, urls: string[]) {
  //   const subject = this.getUserImagesSubject(userId);
  //   const currentState = subject.value;
  //   console.log('Updating user images state:', {
  //     userId,
  //     urlCount: urls.length,
  //     currentIndex: currentState.currentIndex
  //   });
    
  //   subject.next({
  //     urls,
  //     currentIndex: currentState.currentIndex < urls.length ? currentState.currentIndex : 0
  //   });
  // }

  // private updateUserImagesState(userId: string, urls: string[]) {
  //   const subject = this.getUserImagesSubject(userId);
  //   const current = subject.value;
    
  //   console.log('Updating image state:', {
  //     previousUrls: current.urls.length,
  //     newUrls: urls.length,
  //     currentIndex: current.currentIndex
  //   });
  
  //   // Keep current index if valid, otherwise reset to 0
  //   const newIndex = current.currentIndex < urls.length ? current.currentIndex : 0;
  
  //   subject.next({
  //     urls,
  //     currentIndex: newIndex
  //   });
  
  //   console.log('Image state updated:', {
  //     urls: urls.length,
  //     currentIndex: newIndex
  //   });
  // }

  // private updateUserImagesState(userId: string, urls: string[]) {
  //   const subject = this.getUserImagesSubject(userId);
  //   // const current = subject.value;
    
  //   console.log('Updating user images state:', {
  //     userId,
  //     urlCount: urls.length,
  //     currentIndex: 0  // Always start at index 0 since we reordered the array
  //   });
  
  //   subject.next({
  //     urls,
  //     currentIndex: 0
  //   });
  // }
  
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

// private updateUserImagesState(userId: string, urls: string[], currentImage: string | null) {
//   const subject = this.getUserImagesSubject(userId);
//   let currentIndex = 0;

//   if (currentImage) {
//     if (this.temporaryUrl && currentImage === this.temporaryUrl) {
//       // If current image is temporary, start navigation from beginning
//       currentIndex = 0;
//     } else {
//       // Find the current image index in the URLs array
//       currentIndex = urls.findIndex(url => 
//         this.normalizeUrl(url) === this.normalizeUrl(currentImage)
//       );
//       if (currentIndex === -1) currentIndex = 0;
//     }
//   }

//   console.log('Updating user images state:', {
//     userId,
//     urlCount: urls.length,
//     currentImage,
//     currentIndex,
//     urls
//   });

//   subject.next({
//     urls,
//     currentIndex
//   });
// }

  isFirstImage(userId: string): boolean {
    const subject = this.getUserImagesSubject(userId);
    return subject.value.currentIndex === 0;
  }

  // async verifyImageExists(url: string): Promise<boolean> {
  //   try {
  //     let fetchUrl = url;
  //     let fetchOptions: RequestInit = {
  //       method: 'HEAD',
  //       headers: {
  //         'Cache-Control': 'no-cache',
  //         'Pragma': 'no-cache',
  //       },
  //     };
  
  //     if (url.includes('firebasestorage.googleapis.com') || !url.startsWith('http')) {
  //       // Convert Firebase Storage URL to proxied URL
  //       const proxiedUrl = await this.storageService.convertFirebaseUrl(url);
        
  //       if (!proxiedUrl) {
  //         console.warn('Failed to get proxied URL');
  //         return false;
  //       }
  //       fetchUrl = proxiedUrl;
  //     } else {
  //       // For non-Firebase URLs, set mode to 'no-cors'
  //       fetchOptions.mode = 'no-cors';
  //     }
  
  //     const response = await fetch(fetchUrl, fetchOptions);
  
  //     if (response.ok) {
  //       return true;
  //     } else if (response.status === 404) {
  //       console.warn('Image not found (404):', fetchUrl);
  //       return false;
  //     } else {
  //       console.error('Error fetching image:', response.statusText);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Network error when fetching image:', error);
  //     return false;
  //   }
  // }  

  // In ImageManagementService
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

  // getCurrentImage(userId: string): Observable<string | null> {
  //   return this.getUserImagesSubject(userId).pipe(
  //     switchMap(async (state) => {
  //       const url = state.urls[state.currentIndex];
  //       if (!url) return null;
  
  //       if (url.includes('firebasestorage.googleapis.com')) {
  //         const convertedUrl = await this.storageService.convertFirebaseUrl(url);
  //         return convertedUrl;
  //       } else {
  //         return url;
  //       }
  //     })
  //   );
  // }
  
getCurrentImageUrl(userId: string): Observable<string> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => {
      if (state.urls.length === 0) return '';
      return state.urls[state.currentIndex] || '';
    })
  );
}

getCurrentImage(userId: string): Observable<string | null> {
  return this.getUserImagesSubject(userId).pipe(
    map(state => {
      if (state.urls.length === 0) return null;
      // Ensure index is valid
      const validIndex = Math.min(state.currentIndex, state.urls.length - 1);
      return state.urls[validIndex] || null;
    }),
    switchMap(async (url) => {
      if (!url) return null;
      if (url.includes('firebasestorage.googleapis.com')) {
        return this.storageService.convertFirebaseUrl(url);
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

  // async nextImage(userId: string): Promise<void> {
  //   const subject = this.getUserImagesSubject(userId);
  //   const current = subject.value;
    
  //   if (current.urls.length <= 1) return;
    
  //   const newIndex = (current.currentIndex + 1) % current.urls.length;
  //   subject.next({
  //     ...current,
  //     currentIndex: newIndex
  //   });
    
  //   // Ensure the new image is loaded
  //   await this.preloadNextImage(userId, newIndex);
  // }

  // async previousImage(userId: string): Promise<void> {
  //   const subject = this.getUserImagesSubject(userId);
  //   const current = subject.value;
    
  //   if (current.urls.length <= 1) return;
    
  //   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  //   subject.next({
  //     ...current,
  //     currentIndex: newIndex
  //   });
    
  //   // Ensure the new image is loaded
  //   await this.preloadNextImage(userId, newIndex);
  // }

//   nextImage(userId: string): void {
//     const subject = this.getUserImagesSubject(userId);
//     const current = subject.value;
    
//     if (current.urls.length <= 1) return;
    
//     const newIndex = (current.currentIndex + 1) % current.urls.length;
    
//     console.log('Navigating to next image:', {
//       oldIndex: current.currentIndex,
//       newIndex,
//       totalImages: current.urls.length
//     });
    
//     subject.next({
//       ...current,
//       currentIndex: newIndex
//     });
//   }
  
// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  
//   console.log('Navigating to previous image:', {
//     oldIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length
//   });
  
//   subject.next({
//     ...current,
//     currentIndex: newIndex
//   });
// }

nextImage(userId: string): void {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length <= 1) return;
  
  const newIndex = (current.currentIndex + 1) % current.urls.length;
  
  console.log('Navigating to next image:', {
    oldIndex: current.currentIndex,
    newIndex,
    totalImages: current.urls.length,
    isFirstImage: newIndex === 0
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
  
  console.log('Navigating to previous image:', {
    oldIndex: current.currentIndex,
    newIndex,
    totalImages: current.urls.length,
    isFirstImage: newIndex === 0
  });
  
  subject.next({
    ...current,
    currentIndex: newIndex
  });
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
