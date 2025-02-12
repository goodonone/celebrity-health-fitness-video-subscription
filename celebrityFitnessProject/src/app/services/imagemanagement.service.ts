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

// Working
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

// Latest Working
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
//       finalUrls.map(async (url, index) => {
//         try {
//           // Check if this is the current profile image
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Build final URL array with clearer organization
//     let finalUrls: string[] = [];
//     let currentIndex = 0;

//     if (this.temporaryUrl && !this.isProviderProfile) {
//       // Start with provider URL if it exists
//       finalUrls = [this.temporaryUrl];
//       currentIndex = 0;
//       // Append Firebase URLs after provider URL
//       if (urls.length > 0) {
//         finalUrls = [...finalUrls, ...urls];
//       }
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
//       finalUrls.map(async (url, index) => {
//         try {
//           // Check if this is the current profile image
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
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
//       // Start with provider URL if it exists
//       finalUrls = [this.temporaryUrl];
//       currentIndex = 0;
//       // Append Firebase URLs after provider URL
//       if (urls.length > 0) {
//         finalUrls = [...finalUrls, ...urls];
//       }
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
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to ensure proper format
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs
//     subject.next({
//       urls: processedUrls,
//       currentIndex
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
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

//     // Build final URL array with clearer organization
//     let finalUrls: string[] = [];
//     let currentIndex = 0;

//     if (this.temporaryUrl && !this.isProviderProfile) {
//       // Start with provider URL if it exists
//       finalUrls = [this.temporaryUrl];
//       currentIndex = 0;
//       // Append Firebase URLs after provider URL
//       if (urls.length > 0) {
//         finalUrls = [...finalUrls, ...urls];
//       }
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
//       finalUrls.map(async (url, index) => {
//         try {
//           // Check if this is the current profile image
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Process URLs to convert any blob URLs back to API URLs
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         // If it's a blob URL, convert it back to an API URL
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         // For non-blob URLs, use the mapped URL or original URL
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs
//     subject.next({
//       urls: processedUrls,
//       currentIndex
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
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
//       // Start with provider URL if it exists
//       finalUrls = [this.temporaryUrl];
//       currentIndex = 0;
//       // Append Firebase URLs after provider URL
//       if (urls.length > 0) {
//         finalUrls = [...finalUrls, ...urls];
//       }
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
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to ensure proper format
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs
//     subject.next({
//       urls: processedUrls,
//       currentIndex
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
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

//     // Build final URL array - ensure temporary URL is first
//     let finalUrls: string[] = [];
//     let currentIndex = 0;

//     if (this.temporaryUrl && !this.isProviderProfile) {
//       // Start with provider URL if it exists
//       finalUrls = [this.temporaryUrl];
//       currentIndex = 0;
//       // Append Firebase URLs after provider URL
//       if (urls.length > 0) {
//         finalUrls = [...finalUrls, ...urls];
//       }
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
//         currentIndex = foundIndex !== -1 ? foundIndex : 0;
//       }
//     } else {
//       finalUrls = urls;
//     }

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to convert any blob URLs back to API URLs
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs
//     subject.next({
//       urls: processedUrls,
//       currentIndex
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
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

// latest working
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

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
//       // Start with provider URL if it exists
//       finalUrls = [this.temporaryUrl];
//       currentIndex = 0;
//       // Append Firebase URLs after provider URL
//       if (urls.length > 0) {
//         finalUrls = [...finalUrls, ...urls];
//       }
//     } else if (this.currentProfilePath) {
//       if (this.isProviderProfile) {
//         finalUrls = [this.currentProfilePath, ...urls];
//         currentIndex = 0;
//         console.log('Provider profile image added:', this.currentProfilePath);
//       } else {
//         finalUrls = [...urls];
//         const normalizedProfilePath = this.normalizeUrl(this.currentProfilePath);
//         const foundIndex = urls.findIndex(url =>
//           this.normalizeUrl(this.getImagePath(url)) === normalizedProfilePath
//         );
//         currentIndex = foundIndex !== -1 ? foundIndex : 0;
//       }
//     } else {
//       finalUrls = urls;
//     }

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === currentIndex && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to convert any blob URLs back to API URLs
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Log state before updating
//     console.log('Updating state with:', {
//       urls: processedUrls,
//       currentIndex,
//       isProviderProfile: this.isProviderProfile,
//       currentProfilePath: this.currentProfilePath
//     });

//     // Update state with processed URLs
//     subject.next({
//       urls: processedUrls,
//       currentIndex
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images preloaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // First ensure all URLs are in the correct format
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // Add temporary URL if it exists and we're not in provider profile mode
//     if (this.temporaryUrl && !this.isProviderProfile) {
//       urls = [this.temporaryUrl, ...urls];
//     }
    
//     // Add provider profile URL if applicable
//     if (this.currentProfilePath && this.isProviderProfile) {
//       urls = [this.currentProfilePath, ...urls];
//     }

//     // Process and order URLs using processUrlArray
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === 0 && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to ensure proper format
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs and appropriate current index
//     subject.next({
//       urls: processedUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(processedUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(processedUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images preloaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert Firebase URLs to API URLs
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // If current profile is a provider URL and not in the list, add it
//     if (this.currentProfilePath && this.isProviderUrl(this.currentProfilePath) && 
//         !urls.includes(this.currentProfilePath)) {
//       urls.unshift(this.currentProfilePath);
//     }

//     // Process and order URLs using processUrlArray
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === 0 && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to ensure proper format
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs and set current index to 0
//     subject.next({
//       urls: processedUrls,
//       currentIndex: 0
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: 0,
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images preloaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// LATEST WORKING
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // First ensure all URLs are in the correct format
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // Add temporary URL if it exists and we're not in provider profile mode
//     if (this.temporaryUrl && !this.isProviderProfile) {
//       urls = [this.temporaryUrl, ...urls];
//     }
    
//     // Add provider profile URL if applicable
//     if (this.currentProfilePath && this.isProviderProfile) {
//       urls = [this.currentProfilePath, ...urls];
//     }

//     // Process and order URLs using processUrlArray
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Preload images with converted URLs and blob caching
//     const preloadedUrls = await Promise.all(
//       finalUrls.map(async (url, index) => {
//         try {
//           const isCurrentProfile = index === 0 && !this.isProviderProfile;
          
//           const displayUrl = url.includes('firebasestorage.googleapis.com') ?
//             await this.storageService.convertFirebaseUrl(url) : url;

//           // Skip blob creation for profile image
//           if (isCurrentProfile) {
//             return { originalUrl: url, displayUrl };
//           }

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

//     // Create map of preloaded URLs and process them
//     const urlMap = new Map(preloadedUrls.map(({ originalUrl, displayUrl }) => [originalUrl, displayUrl]));

//     // Process URLs to ensure proper format
//     const processedUrls = await Promise.all(
//       finalUrls.map(async (url) => {
//         if (urlMap.get(url)?.startsWith('blob:')) {
//           const path = await this.getOriginalPath(userId, finalUrls.indexOf(url));
//           if (path) {
//             return `${environment.apiUrl}/api/storage/${path}`;
//           }
//         }
//         return urlMap.get(url) || url;
//       })
//     );

//     // Update state with processed URLs and appropriate current index
//     subject.next({
//       urls: processedUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(processedUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(processedUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images preloaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// Main Method
// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert any Firebase URLs to API URLs
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // If temporaryUrl is set and not in provider profile mode, prepend it
//     if (this.temporaryUrl && !this.isProviderProfile) {
//       urls = [this.temporaryUrl, ...urls];
//     }

//     // If in provider profile mode, ensure provider URL is first
//     if (this.currentProfilePath && this.isProviderProfile) {
//       urls = [this.currentProfilePath, ...urls];
//     }

//     // Process and order URLs
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Update state with final URLs
//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert any Firebase URLs to API URLs
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // If we have a temporary provider URL and we are currently changing picture
//     // and the profile is not currently a provider profile image:
//     // This means user pasted a provider URL for preview.
//     if (this.temporaryUrl && !this.isProviderProfile) {
//       urls = [this.temporaryUrl, ...urls];
//     }

//     // If the current profile is a provider URL (e.g. Unsplash):
//     // Ensure the provider image (this.currentProfilePath) is always at the front.
//     // This indicates that the currently set profile image is a provider image.
//     if (this.currentProfilePath && this.isProviderProfile) {
//       // Make sure we don't add duplicates if currentProfilePath is already in `urls`
//       // (In normal scenarios, currentProfilePath might not be in urls since it's a provider URL)
//       // Just ensure it's at the front:
//       urls = [this.currentProfilePath, ...urls.filter(u => u !== this.currentProfilePath)];
//     }

//     // Process and order URLs (e.g., sorting Firebase images by timestamp)
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Update state with final URLs
//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// main method
// async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert any Firebase URLs to API URLs
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // If we have a temporary provider URL, and we are currently changing picture,
//     // and the profile is not currently a provider profile:
//     if (this.temporaryUrl && !this.isProviderProfile && inChangePictureState) {
//       urls = [this.temporaryUrl, ...urls];
//     }

//     // If the current profile is a provider URL, ensure it's at the front
//     if (this.currentProfilePath && this.isProviderProfile) {
//       urls = [this.currentProfilePath, ...urls.filter(u => u !== this.currentProfilePath)];
//     }

//     const finalUrls = this.processUrlArray(urls, userId);

//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// main method
// async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert Firebase URLs to API URLs
//     urls = await Promise.all(
//       urls.map(async (url) => {
//         if (url.includes('firebasestorage.googleapis.com')) {
//           return this.storageService.convertFirebaseUrl(url);
//         }
//         return url;
//       })
//     );

//     // Scenario 1: Current profile is a provider URL (Unsplash)
//     // If isProviderProfile is true, the currentProfilePath (provider URL) should always be at the front.
//     // This ensures that when we enter the change picture state, the provider image is shown first.
//     if (this.isProviderProfile && this.currentProfilePath && this.isProviderUrl(this.currentProfilePath)) {
//       // Put the provider URL at the front if it's not already there
//       // (This also ensures it's not discarded prematurely)
//       urls = [this.currentProfilePath, ...urls.filter(u => u !== this.currentProfilePath)];
//     } else {
//       // Scenario 2: The current profile is not a provider URL, and we may have a temporary pasted URL.
//       // If we are in change picture state and we have a temporary provider URL, place it at the front.
//       // This allows the user to preview the newly pasted provider URL before saving.
//       if (this.temporaryUrl && !this.isProviderProfile && inChangePictureState) {
//         urls = [this.temporaryUrl, ...urls];
//       }
//     }

//     // Process and order URLs (e.g., sort firebase images by timestamp)
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Update the subject with final URLs.
//     // If isProviderProfile is true, currentIndex is set to 0 so that the provider URL (the current profile image) is displayed first.
//     // If isProviderProfile is false, find the current profile image in the finalUrls and set the index accordingly.
//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// Latest main method
// async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files and get Firebase URLs
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert Firebase URLs to API URLs
//     urls = await Promise.all(
//       urls.map(async (url) => {
//         if (url.includes('firebasestorage.googleapis.com')) {
//           return this.storageService.convertFirebaseUrl(url);
//         }
//         return url;
//       })
//     );

//     // Scenario 1: If the current profile is a provider URL and isProviderProfile = true,
//     // ensure that provider URL is at the front.
//     if (this.isProviderProfile && this.currentProfilePath && this.isProviderUrl(this.currentProfilePath)) {
//       urls = [this.currentProfilePath, ...urls.filter(u => u !== this.currentProfilePath)];
//     } else {
//       // Scenario 2: No provider profile currently.
//       // If in changing picture state and we have a temporary pasted URL, put it at the front to preview.
//       if (this.temporaryUrl && !this.isProviderProfile && inChangePictureState) {
//         urls = [this.temporaryUrl, ...urls];
//       }
//     }

//     // Process and order URLs
//     let finalUrls = this.processUrlArray(urls, userId);

//     // If the profile is not provider and no temporary URL is needed,
//     // ensure no leftover provider URLs remain.
//     if (!this.isProviderProfile && (!this.temporaryUrl || !inChangePictureState)) {
//       finalUrls = finalUrls.filter(url => {
//         // Remove provider URLs if we're not in a scenario that needs them
//         return !this.isProviderUrl(url);
//       });
//     }

//     // Reintroduce preloading logic to improve UX (similar to old code):
//     // Preload images so that navigation is instant.
//     await Promise.all(finalUrls.map(url => this.preloadSingleImage(url)));

//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }


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

// setCurrentProfileImage(path: string) {
//   // If it's a provider URL, store it as is
//   if (this.isProviderUrl(path)) {
//     this.currentProfilePath = path;
//     this.isProviderProfile = true;
//   } else {
//     this.currentProfilePath = this.getImagePath(path);
//     this.isProviderProfile = false;
//   }
//   console.log('Set current profile path:', this.currentProfilePath, 'isProvider:', this.isProviderProfile);
// }

setCurrentProfileImage(path: string) {
  console.log('Setting current profile image:', path);
  
  // Clear any temporary URL when setting profile image
  this.temporaryUrl = null;
  
  if (this.isProviderUrl(path)) {
    this.currentProfilePath = path;
    this.isProviderProfile = true;
    console.log('Set provider URL as profile:', {
      path: this.currentProfilePath,
      isProvider: this.isProviderProfile
    });
  } else {
    this.currentProfilePath = this.getImagePath(path);
    this.isProviderProfile = false;
    console.log('Set storage URL as profile:', {
      path: this.currentProfilePath,
      isProvider: this.isProviderProfile
    });
  }
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

    // If current profile is a provider URL and isProviderProfile = true,
    // ensure that provider URL is at the front.
    if (this.isProviderProfile && this.currentProfilePath && this.isProviderUrl(this.currentProfilePath)) {
      urls = [this.currentProfilePath, ...urls.filter(u => u !== this.currentProfilePath)];
    } else {
      // Current profile is not a provider URL
      // If in change picture state and have a temporary provider URL, show it first
      if (this.temporaryUrl && !this.isProviderProfile && inChangePictureState) {
        urls = [this.temporaryUrl, ...urls];
      }
    }

    // Process and order URLs (sort firebase images, etc.)
    let finalUrls = this.processUrlArray(urls, userId);

    // If not provider profile and not currently previewing a temporary provider URL,
    // remove all provider URLs.
    if (!this.isProviderProfile) {
      // Only keep provider URLs if we are currently previewing one
      if (!(this.temporaryUrl && inChangePictureState)) {
        finalUrls = finalUrls.filter(url => !this.isProviderUrl(url));
      }
    }

    // Preload images to improve UX
    await Promise.all(finalUrls.map(url => this.preloadSingleImage(url)));

    // Set currentIndex
    const currentIndex = this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls);

    subject.next({
      urls: finalUrls,
      currentIndex
    });

    console.log('Final URL array:', {
      urls: finalUrls,
      currentIndex,
      hasProviderUrl: !!this.temporaryUrl,
      isProviderProfile: this.isProviderProfile,
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


// async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;
//   this.loadingImages = true;
  
//   const subject = this.getUserImagesSubject(userId);
  
//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);
    
//     // Convert Firebase URLs to API URLs
//     urls = await Promise.all(
//       urls.map(async (url) => {
//         if (url.includes('firebasestorage.googleapis.com')) {
//           return this.storageService.convertFirebaseUrl(url);
//         }
//         return url;
//       })
//     );

//     let finalUrls: string[] = [];
//     let currentIndex = 0;

//     // Only include provider URL if it's the current profile image
//     if (this.currentProfilePath && this.isProviderProfile && this.isProviderUrl(this.currentProfilePath)) {
//       // Provider URL is current profile, put it first
//       finalUrls = [this.currentProfilePath, ...urls];
//       currentIndex = 0;
//     } else {
//       // Current profile is a Firebase image, remove any provider URLs
//       finalUrls = urls;
      
//       // Find the current profile image in the Firebase URLs
//       if (this.currentProfilePath) {
//         const currentImageIndex = finalUrls.findIndex(url => 
//           this.normalizeUrl(url) === this.normalizeUrl(this.currentProfilePath!)
//         );
//         currentIndex = currentImageIndex !== -1 ? currentImageIndex : 0;
//       }
//     }

//     // Update state with processed URLs
//     subject.next({
//       urls: finalUrls,
//       currentIndex
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex,
//       isProviderProfile: this.isProviderProfile,
//       currentProfilePath: this.currentProfilePath,
//       firebaseImageCount: this.firebaseImageCount
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;
//   this.loadingImages = true;
  
//   const subject = this.getUserImagesSubject(userId);
  
//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);
    
//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);
    
//     // Convert Firebase URLs to API URLs
//     urls = await Promise.all(
//       urls.map(async (url) => {
//         if (url.includes('firebasestorage.googleapis.com')) {
//           return this.storageService.convertFirebaseUrl(url);
//         }
//         return url;
//       })
//     );

//     // If current profile is a provider URL, include it in navigation
//     if (this.currentProfilePath && this.isProviderUrl(this.currentProfilePath)) {
//       // Put provider URL first, followed by Firebase URLs
//       urls = [this.currentProfilePath, ...urls];
//       subject.next({
//         urls,
//         currentIndex: 0  // Always show provider URL first
//       });
//     } 
//     // If we have a temporary provider URL and current profile is not a provider URL
//     else if (this.temporaryUrl && !this.isProviderProfile) {
//       urls = [this.temporaryUrl, ...urls];
//       subject.next({
//         urls,
//         currentIndex: 0
//       });
//     }
//     // Otherwise just show Firebase URLs
//     else {
//       subject.next({
//         urls,
//         currentIndex: 0
//       });
//     }

//     console.log('Final URL array:', {
//       urls,
//       currentIndex: 0,
//       isProviderProfile: this.isProviderProfile,
//       currentProfilePath: this.currentProfilePath,
//       hasProviderUrl: this.temporaryUrl !== null,
//       firebaseImageCount: this.firebaseImageCount
//     });

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

// Example of a simple preload method:
// private async preloadSingleImage(url: string): Promise<void> {
//   if (this.preloadedImages.has(url)) return; // Already preloaded

//   try {
//     const response = await fetch(url, { method: 'HEAD' });
//     if (response.ok) {
//       // Just a HEAD check might be enough, or actually fetch image:
//       const img = new Image();
//       await new Promise((resolve, reject) => {
//         img.onload = () => {
//           this.preloadedImages.set(url, true);
//           resolve('');
//         };
//         img.onerror = reject;
//         img.src = url;
//       });
//     }
//   } catch (error) {
//     console.warn('Could not preload image', url, error);
//   }
// }

// async loadUserImages(userId: string, inChangePictureState: boolean): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files and get Firebase URLs
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert Firebase URLs to API URLs
//     urls = await Promise.all(
//       urls.map(async (url) => {
//         if (url.includes('firebasestorage.googleapis.com')) {
//           return this.storageService.convertFirebaseUrl(url);
//         }
//         return url;
//       })
//     );

//     // Scenario 1: If the current profile is a provider URL and isProviderProfile = true,
//     // ensure that provider URL is at the front.
//     if (this.isProviderProfile && this.currentProfilePath && this.isProviderUrl(this.currentProfilePath)) {
//       urls = [this.currentProfilePath, ...urls.filter(u => u !== this.currentProfilePath)];
//     } else {
//       // Scenario 2: No provider profile currently.
//       // If in changing picture state and we have a temporary pasted URL, put it at the front to preview.
//       if (this.temporaryUrl && !this.isProviderProfile && inChangePictureState) {
//         urls = [this.temporaryUrl, ...urls];
//       }
//     }

//     // Process and order URLs
//     let finalUrls = this.processUrlArray(urls, userId);

//     // If the profile is not provider and no temporary URL is needed,
//     // ensure no leftover provider URLs remain.
//     if (!this.isProviderProfile && (!this.temporaryUrl || !inChangePictureState)) {
//       finalUrls = finalUrls.filter(url => {
//         // Remove provider URLs if we're not in a scenario that needs them
//         return !this.isProviderUrl(url);
//       });
//     }

//     // Reintroduce preloading logic to improve UX (similar to old code):
//     // Preload images so that navigation is instant.
//     await Promise.all(finalUrls.map(url => this.preloadSingleImage(url)));

//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

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

// async loadUserImages(userId: string): Promise<void> {
//   console.log('Starting loadUserImages');
//   if (this.loadingImages) return;

//   this.loadingImages = true;
//   const subject = this.getUserImagesSubject(userId);

//   try {
//     // List files from Firebase
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     let urls = await this.getValidUrls(validItems);

//     console.log('Firebase images loaded:', urls);

//     // Update hasFirebaseImages state
//     this.firebaseImageCount = urls.length;
//     this.hasFirebaseImagesSubject.next(urls.length > 0);

//     // Convert any Firebase URLs to API URLs
//     urls = await Promise.all(urls.map(async (url) => {
//       if (url.includes('firebasestorage.googleapis.com')) {
//         return this.storageService.convertFirebaseUrl(url);
//       }
//       return url;
//     }));

//     // Conditionally prepend the temporary URL
//     // Only do this if we're in "change picture" mode (assuming a boolean or method for that),
//     // and the profile is not currently a provider profile,
//     // and temporaryUrl is set (meaning user just pasted a provider URL)
//     if (this.temporaryUrl && !this.isProviderProfile) {
//       urls = [this.temporaryUrl, ...urls];
//     }

//     // If in provider profile mode, ensure provider URL is first
//     // This means the current profile image is a provider URL that has been saved as the profile picture
//     if (this.currentProfilePath && this.isProviderProfile) {
//       urls = [this.currentProfilePath, ...urls];
//     }

//     // Process and order URLs
//     const finalUrls = this.processUrlArray(urls, userId);

//     // Update state with final URLs
//     subject.next({
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls)
//     });

//     console.log('Final URL array:', {
//       urls: finalUrls,
//       currentIndex: this.isProviderProfile ? 0 : this.findCurrentImageIndex(finalUrls),
//       hasProviderUrl: !!this.temporaryUrl,
//       isProviderProfile: this.isProviderProfile,
//       firebaseImageCount: this.firebaseImageCount
//     });

//     console.log('All images loaded successfully');

//   } catch (error) {
//     console.error('Error loading user images:', error);
//     this.firebaseImageCount = 0;
//     this.hasFirebaseImagesSubject.next(false);
//     // Initialize empty state on error
//     subject.next({ urls: [], currentIndex: 0 });
//   } finally {
//     this.loadingImages = false;
//   }
// }

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

private async preloadAllImages(urls: string[]): Promise<void> {
  try {
    const preloadPromises = urls.map(url => this.preloadSingleImage(url));
    await Promise.all(preloadPromises);
    console.log('All images preloaded successfully');
  } catch (error) {
    console.error('Error preloading images:', error);
  }
}


// private async preloadSingleImage(url: string): Promise<void> {
//   if (this.preloadedImages.has(url)) return;

//   try {
//     let displayUrl = url;
    
//     // Convert URL if needed
//     if (url.includes('firebasestorage.googleapis.com')) {
//       displayUrl = await this.storageService.convertFirebaseUrl(url);
//     }

//     // Get auth headers if needed
//     const headers = displayUrl.includes('/api/storage/') ?
//       await this.storageService.getAuthHeaders() : undefined;

//     await new Promise<void>(async (resolve, reject) => {
//       try {
//         if (headers) {
//           const response = await fetch(displayUrl, { headers });
//           if (!response.ok) throw new Error('Failed to fetch image');
//           const blob = await response.blob();
//           const objectUrl = URL.createObjectURL(blob);
//           const img = new Image();
//           img.onload = () => {
//             URL.revokeObjectURL(objectUrl);
//             this.preloadedImages.set(url, true);
//             resolve();
//           };
//           img.onerror = () => {
//             URL.revokeObjectURL(objectUrl);
//             reject(new Error('Image load failed'));
//           };
//           img.src = objectUrl;
//         } else {
//           const img = new Image();
//           img.onload = () => {
//             this.preloadedImages.set(url, true);
//             resolve();
//           };
//           img.onerror = () => reject(new Error('Image load failed'));
//           img.src = displayUrl;
//         }
//       } catch (error) {
//         reject(error);
//       }
//     });

//   } catch (error) {
//     console.error('Error preloading image:', error);
//     throw error;
//   }
// }



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

// private async getValidItemsWithMetadata(items: StorageReference[]) {
//   const itemsWithMetadata = await Promise.all(
//     items.map(async (item) => {
//       try {
//         const metadata = await getMetadata(item);
//         return {
//           ref: item,
//           metadata,
//           path: item.fullPath,
//           timeCreated: new Date(metadata.timeCreated).getTime()
//         };
//       } catch (error) {
//         console.error('Error getting metadata for:', item.fullPath, error);
//         return null;
//       }
//     })
//   );

//   return itemsWithMetadata
//     .filter((item): item is NonNullable<typeof item> => item !== null)
//     .sort((a, b) => a.timeCreated - b.timeCreated); // Changed from b - a to a - b
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
    .sort((a, b) => a.timeCreated - b.timeCreated); // Sort by creation time ascending
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

// async getOriginalPath(userId: string, index: number): Promise<string | null> {
//   try {
//     // Get current state to check the URL type first
//     const subject = this.getUserImagesSubject(userId);
//     const state = subject.value;
    
//     // Validate index
//     if (index < 0 || index >= state.urls.length) return null;

//     // Get current URL at index
//     const currentUrl = state.urls[index];
//     if (!currentUrl) return null;

//     // For provider URLs (Unsplash etc), return as is
//     if (this.isProviderUrl(currentUrl)) {
//       return currentUrl;
//     }

//     // For direct storage paths, return as is
//     if (currentUrl.startsWith('profileImages/')) {
//       return currentUrl;
//     }

//     // For API URLs, extract path
//     if (currentUrl.includes('/api/storage/')) {
//       return currentUrl.split('/api/storage/')[1];
//     }

//     // For Firebase URLs, extract path
//     if (currentUrl.includes('firebasestorage.googleapis.com')) {
//       const urlObj = new URL(currentUrl);
//       return decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//     }

//     // For blob URLs or if we can't determine the type, 
//     // fall back to getting the path from storage listing
//     const imagesRef = ref(storage, `profileImages/${userId}`);
//     const result = await listAll(imagesRef);
//     const validItems = await this.getValidItemsWithMetadata(result.items);
//     const paths = await this.getOriginalPaths(validItems);
    
//     if (index >= 0 && index < paths.length) {
//       return paths[index];
//     }

//     return null;

//   } catch (error) {
//     console.error('Error getting original path:', error);
//     return null;
//   }
// }
  
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
// async deleteCurrentImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length === 0) return;

//   try {
//     const currentUrl = current.urls[current.currentIndex];
//     if (!currentUrl) {
//       throw new Error('No current image URL found');
//     }

//     const isProvider = this.isProviderUrl(currentUrl);

//     // Remove the URL first to enable immediate UI update
//     const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
//     const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);

//     // If it's a Firebase image, delete from storage
//     if (!isProvider) {
//       try {
//         await this.deleteImageByUrl(currentUrl);
//         this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
//         this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
//       } catch (deleteError) {
//         console.error('Error deleting from storage:', deleteError);
//         // Continue with state update even if storage delete fails
//       }
//     } else {
//       // If it's a provider URL, just clear it
//       this.temporaryUrl = null;
//     }

//     // Update the state immediately to show next image
//     subject.next({
//       urls: updatedUrls,
//       currentIndex: Math.max(0, newIndex)
//     });

//     // If we deleted the last image, clear current profile image
//     if (updatedUrls.length === 0) {
//       this.hasFirebaseImagesSubject.next(false);
//       this.currentProfileImage = null;
//     } else {
//       // Set the next image as current
//       this.currentProfileImage = updatedUrls[newIndex];
//     }

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     throw error;
//   }
// }

// Main method
// async deleteCurrentImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length === 0) return;

//   try {
//     const currentUrl = current.urls[current.currentIndex];
//     if (!currentUrl) {
//       throw new Error('No current image URL found');
//     }

//     // Handle blob URLs by getting the original path
//     let urlToDelete = currentUrl;
//     if (currentUrl.startsWith('blob:')) {
//       // Get the original storage path
//       const originalPath = await this.getOriginalPath(userId, current.currentIndex);
//       if (originalPath) {
//         urlToDelete = `${environment.apiUrl}/api/storage/${originalPath}`;
//       } else {
//         throw new Error('Could not determine original path for blob URL');
//       }
//     }

//     const isProvider = this.isProviderUrl(urlToDelete);

//     // Remove the URL first to enable immediate UI update
//     const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
//     const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);

//     // If it's a Firebase image, delete from storage
//     if (!isProvider) {
//       try {
//         await this.deleteImageByUrl(urlToDelete);
//         this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
//         this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
//       } catch (deleteError) {
//         console.error('Error deleting from storage:', deleteError);
//       }
//     } else {
//       this.temporaryUrl = null;
//     }

//     // Update the state immediately with converted URLs
//     subject.next({
//       urls: updatedUrls,
//       currentIndex: Math.max(0, newIndex)
//     });

//     // If we deleted the last image, clear current profile image
//     if (updatedUrls.length === 0) {
//       this.hasFirebaseImagesSubject.next(false);
//       this.currentProfileImage = null;
//     } else {
//       // Convert the next image URL if it's a blob URL
//       let nextUrl = updatedUrls[newIndex];
//       if (nextUrl.startsWith('blob:')) {
//         const originalPath = await this.getOriginalPath(userId, newIndex);
//         if (originalPath) {
//           nextUrl = `${environment.apiUrl}/api/storage/${originalPath}`;
//         }
//       }
//       this.currentProfileImage = nextUrl;
//     }

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     throw error;
//   }
// }

// Update deleteCurrentImage method to handle provider URLs better
// async deleteCurrentImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length === 0) return;

//   try {
//     const currentUrl = current.urls[current.currentIndex];
//     if (!currentUrl) {
//       throw new Error('No current image URL found');
//     }

//     // Handle blob URLs by getting the original path
//     let urlToDelete = currentUrl;
//     if (currentUrl.startsWith('blob:')) {
//       const originalPath = await this.getOriginalPath(userId, current.currentIndex);
//       if (originalPath) {
//         urlToDelete = `${environment.apiUrl}/api/storage/${originalPath}`;
//       } else {
//         throw new Error('Could not determine original path for blob URL');
//       }
//     }

//     const isProvider = this.isProviderUrl(urlToDelete);

//     // Remove the URL first to enable immediate UI update
//     const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
//     const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);

//     // If it's a Firebase image, delete from storage
//     if (!isProvider) {
//       try {
//         await this.deleteImageByUrl(urlToDelete);
//         this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
//         this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
//       } catch (deleteError) {
//         console.error('Error deleting from storage:', deleteError);
//       }
//     } else {
//       // For provider URLs, ensure we clear temporary URL
//       this.temporaryUrl = null;
//       // Also clear from converted URL cache if it exists
//       if (this.convertedUrlCache) {
//         this.convertedUrlCache.delete(urlToDelete);
//       }
//     }

//     // If this was the last image and it was a provider URL
//     if (updatedUrls.length === 0) {
//       this.resetToDefaultState(userId);
//     } else {
//       // Update the state with remaining URLs
//       subject.next({
//         urls: updatedUrls,
//         currentIndex: Math.max(0, newIndex)
//       });

//       // Update current profile image if needed
//       if (updatedUrls.length > 0) {
//         const nextUrl = updatedUrls[newIndex];
//         this.currentProfileImage = nextUrl;
//       }
//     }

//   } catch (error) {
//     console.error('Error deleting image:', error);
//     throw error;
//   }
// }

async deleteCurrentImage(userId: string): Promise<void> {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length === 0) return;

  try {
    const currentUrl = current.urls[current.currentIndex];
    if (!currentUrl) {
      throw new Error('No current image URL found');
    }

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

    const isProvider = this.isProviderUrl(urlToDelete);

    // Remove the URL first to enable immediate UI update
    const updatedUrls = current.urls.filter((_, index) => index !== current.currentIndex);
    const newIndex = Math.min(current.currentIndex, updatedUrls.length - 1);

    // If it's a Firebase image, delete from storage
    if (!isProvider) {
      try {
        await this.deleteImageByUrl(urlToDelete);
        this.firebaseImageCount = Math.max(0, this.firebaseImageCount - 1);
        this.hasFirebaseImagesSubject.next(this.firebaseImageCount > 0);
      } catch (deleteError) {
        console.error('Error deleting from storage:', deleteError);
      }
    } else {
      // For provider URLs, ensure we clear temporary URL
      this.temporaryUrl = null;
      // Also clear from converted URL cache if it exists
      if (this.convertedUrlCache) {
        this.convertedUrlCache.delete(urlToDelete);
      }
    }

    // If this was the last image and it was a provider URL
    if (updatedUrls.length === 0) {
      this.resetToDefaultState(userId);
    } else {
      // Update the state with remaining URLs
      subject.next({
        urls: updatedUrls,
        currentIndex: Math.max(0, newIndex)
      });
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
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
  this.isProviderProfile = false;
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

// private async deleteImageByUrl(url: string) {
//   const urlObj = new URL(url);
//   const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//   const imageRef = ref(storage, path);
//   await deleteObject(imageRef);
// }

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

    // Handle provider URLs (like Unsplash)
    if (this.isProviderUrl(url)) {
      // No need to delete provider URLs from storage
      return;
    }

    // Add this case after the provider URL check
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

// Last working
// getCurrentState(userId: string): {
//   hasImages: boolean;
//   currentUrl: string | null;
//   isProviderImage: boolean;
// } {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length === 0) {
//     return {
//       hasImages: false,
//       currentUrl: null,
//       isProviderImage: false
//     };
//   }

//   const currentUrl = current.urls[current.currentIndex];
//   return {
//     hasImages: true,
//     currentUrl,
//     isProviderImage: this.isProviderUrl(currentUrl)
//   };
// }

getCurrentState(userId: string): {
  hasImages: boolean;
  currentUrl: string | null;
  isProviderImage: boolean;
} {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length === 0) {
    return {
      hasImages: false,
      currentUrl: null,
      isProviderImage: false
    };
  }

  // Pass userId to ensureValidUrls
  const validUrls = this.ensureValidUrls(current.urls, userId);
  const currentUrl = validUrls[current.currentIndex];

  return {
    hasImages: true,
    currentUrl,
    isProviderImage: this.isProviderUrl(currentUrl)
  };
}

private ensureValidUrls(urls: string[], userId: string): string[] {
  return urls.map(url => {
    if (this.isProviderUrl(url)) {
      return url; // Keep provider URLs as-is
    }
    if (url.startsWith('blob:')) {
      const pathMatch = url.match(/\/([^/]+)$/);
      if (pathMatch) {
        return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
      }
    }
    return url;
  });
}

// // Helper method to reset to default state when no images
// private resetToDefaultState(userId: string) {
//   const subject = this.getUserImagesSubject(userId);
//   subject.next({
//     urls: [],
//     currentIndex: 0
//   });
  
//   this.temporaryUrl = null;
//   this.currentProfileImage = null;
//   this.firebaseImageCount = 0;
//   this.hasFirebaseImagesSubject.next(false);
// }

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

// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
//       return state.urls[state.currentIndex] || '';
//     })
//   );
// }

// Last Working
// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
      
//       const currentUrl = state.urls[state.currentIndex] || '';
//       // Always ensure we're returning a proxied URL, not a blob URL
//       if (currentUrl.startsWith('blob:')) {
//         const pathMatch = currentUrl.match(/\/([^/]+)$/);
//         if (pathMatch) {
//           return `${this.baseUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//         }
//       }
//       return currentUrl;
//     })
//   );
// }

// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
      
//       const currentUrl = state.urls[state.currentIndex];
//       if (!currentUrl) return '';

//       // Don't allow blob URLs to be returned
//       if (currentUrl.startsWith('blob:')) {
//         const pathMatch = currentUrl.match(/\/([^/]+)$/);
//         if (pathMatch) {
//           return `${this.baseUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//         }
//       }

//       return currentUrl;
//     })
//   );
// }

// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
      
//       const currentUrl = state.urls[state.currentIndex];
//       if (!currentUrl) return '';

//       // Always return provider URLs as-is
//       if (this.isProviderUrl(currentUrl)) {
//         return currentUrl;
//       }

//       // Handle blob URLs
//       if (currentUrl.startsWith('blob:')) {
//         const pathMatch = currentUrl.match(/\/([^/]+)$/);
//         if (pathMatch) {
//           return `${this.baseUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//         }
//       }

//       return currentUrl;
//     })
//   );
// }

// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
      
//       const currentUrl = state.urls[state.currentIndex];
//       if (!currentUrl) return '';

//       // Convert blob URLs to API URLs immediately
//       if (currentUrl.startsWith('blob:')) {
//         const pathMatch = currentUrl.match(/\/([^/]+)$/);
//         if (pathMatch) {
//           return `${this.baseUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//         }
//       }

//       // Ensure Firebase URLs use the API format
//       if (currentUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(currentUrl);
//         const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//         return `${this.baseUrl}/api/storage/${path}`;
//       }

//       return currentUrl;
//     })
//   );
// }

// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
      
//       const currentUrl = state.urls[state.currentIndex];
//       if (!currentUrl) return '';

//       // For provider URLs, return as-is
//       if (this.isProviderUrl(currentUrl)) {
//         return currentUrl;
//       }

//       // Convert Firebase URLs to API format
//       if (currentUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(currentUrl);
//         const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//         return `${this.baseUrl}/api/storage/${path}`;
//       }

//       // For API URLs, return as-is
//       if (currentUrl.includes('/api/storage/')) {
//         return currentUrl;
//       }

//       return currentUrl;
//     })
//   );
// }

// Main method
// getCurrentImageUrl(userId: string): Observable<string> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return '';
      
//       const currentUrl = state.urls[state.currentIndex];
//       if (!currentUrl) return '';

//       // For provider URLs, return as-is
//       if (this.isProviderUrl(currentUrl)) {
//         return currentUrl;
//       }

//       // Convert Firebase URLs to API format
//       if (currentUrl.includes('firebasestorage.googleapis.com')) {
//         const urlObj = new URL(currentUrl);
//         const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
//         return `${this.baseUrl}/api/storage/${path}`;
//       }

//       // For API URLs, return as-is
//       if (currentUrl.includes('/api/storage/')) {
//         return currentUrl;
//       }

//       return currentUrl;
//     })
//   );
// }



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

// Main method
// getCurrentImage(userId: string): Observable<string | null> {
//   return this.getUserImagesSubject(userId).pipe(
//     map(state => {
//       if (state.urls.length === 0) return null;
//       const validIndex = Math.min(state.currentIndex, state.urls.length - 1);
//       return state.urls[validIndex] || null;
//     }),
//     // Add switchMap to resolve any promises
//     switchMap(async (url) => {
//       if (!url) return null;

//       // If it's already a proxied URL, return it directly
//       if (url.includes('/api/storage/')) {
//         return url;
//       }
      
//       // If it's a Firebase URL, convert it synchronously
//       // if (url.includes('firebasestorage.googleapis.com')) {
//       //   const displayUrl = await this.storageService.convertFirebaseUrl(url);
//       //   return displayUrl;
//       // }
      
//       // For provider URLs or other URLs, return as is
//       return url;
//     })
//   );
// }

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
        // If it's a provider URL, use it directly
        if (this.isProviderUrl(currentUrl)) {
          return currentUrl;
        }

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

// Last Working
// nextImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex + 1) % current.urls.length;

//   // Set flag that we're started navigation
//   this.hasStartedNavigating = true;
  
//   console.log('Navigating to next image:', {
//     oldIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length,
//     isFirstImage: newIndex === 0,
//     hasStartedNavigating: this.hasStartedNavigating
//   });
  
//   subject.next({
//     ...current,
//     currentIndex: newIndex
//   });
// }

// // Last Working
// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  
//   // Set flag that we've started navigating
//   this.hasStartedNavigating = true;

//   console.log('Navigating to previous image:', {
//     oldIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length,
//     hasStartedNavigating: this.hasStartedNavigating
//   });
  
//   subject.next({
//     ...current,
//     currentIndex: newIndex
//   });
// }


// nextImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate next index
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
  
//   // Set navigation flag
//   this.hasStartedNavigating = true;
  
//   // Ensure we're using the correct URL format before updating state
//   const updatedUrls = current.urls.map(url => {
//     if (url.startsWith('blob:')) {
//       // Convert blob URLs to API URLs
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // Log state transition for debugging
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length,
//     currentUrl: current.urls[current.currentIndex],
//     nextUrl: updatedUrls[newIndex]
//   });

//   // Update state with processed URLs
//   subject.next({
//     urls: updatedUrls,
//     currentIndex: newIndex
//   });
// }

// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate previous index
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  
//   // Set navigation flag
//   this.hasStartedNavigating = true;
  
//   // Ensure we're using the correct URL format before updating state
//   const updatedUrls = current.urls.map(url => {
//     if (url.startsWith('blob:')) {
//       // Convert blob URLs to API URLs
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // Log state transition for debugging
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length,
//     currentUrl: current.urls[current.currentIndex],
//     nextUrl: updatedUrls[newIndex]
//   });

//   // Update state with processed URLs
//   subject.next({
//     urls: updatedUrls,
//     currentIndex: newIndex
//   });
// }

// private processUrlArray(urls: string[], userId: string): string[] {
//   // Split URLs into provider and storage URLs
//   const providerUrls = urls.filter(url => this.isProviderUrl(url));
//   const storageUrls = urls.filter(url => !this.isProviderUrl(url)).map(url => {
//     // Convert blob URLs to API URLs
//     if (url.startsWith('blob:')) {
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   }).sort((a, b) => {
//     // Sort storage URLs by timestamp in filename if possible
//     const getTimestamp = (url: string) => {
//       const match = url.match(/\/(\d+)-/);
//       return match ? parseInt(match[1]) : 0;
//     };
//     return getTimestamp(a) - getTimestamp(b);
//   });

//   // Combine arrays with provider URLs first
//   return [...providerUrls, ...storageUrls];
// }

// private processUrlArray(urls: string[], userId: string): string[] {
//   // If there's a provider URL and it's the profile image, it should always be first
//   if (this.isProviderProfile && this.currentProfilePath) {
//     const otherUrls = urls.filter(url => url !== this.currentProfilePath);
//     return [this.currentProfilePath, ...otherUrls];
//   }

//   // For non-provider profile cases, process URLs normally
//   const providerUrls = urls.filter(url => this.isProviderUrl(url));
//   const storageUrls = urls
//     .filter(url => !this.isProviderUrl(url))
//     .map(url => {
//       if (url.startsWith('blob:')) {
//         const pathMatch = url.match(/\/([^/]+)$/);
//         if (pathMatch) {
//           return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//         }
//       }
//       return url;
//     })
//     .sort((a, b) => {
//       const getTimestamp = (url: string) => {
//         const match = url.match(/\/(\d+)-/);
//         return match ? parseInt(match[1]) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   return [...providerUrls, ...storageUrls];
// }

// private processUrlArray(urls: string[], userId: string): string[] {
//   // First, normalize all URLs to their API format
//   const normalizedUrls = urls.map(url => {
//     if (url.startsWith('blob:')) {
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // Split URLs into provider and storage URLs
//   const providerUrls = normalizedUrls.filter(url => this.isProviderUrl(url));
//   const storageUrls = normalizedUrls
//     .filter(url => !this.isProviderUrl(url))
//     .sort((a, b) => {
//       // Extract timestamps from URLs for sorting
//       const getTimestamp = (url: string) => {
//         const match = url.match(/\/(\d+)-/);
//         return match ? parseInt(match[1]) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   // Provider URLs first when in provider profile mode
//   if (this.isProviderProfile) {
//     return [...providerUrls, ...storageUrls];
//   }

//   return [...storageUrls, ...providerUrls];
// }

// LATEST WORKING
// private processUrlArray(urls: string[], userId: string): string[] {
//   // First normalize all URLs
//   const normalizedUrls = urls.map(url => {
//     if (url.startsWith('blob:')) {
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // If there's a temporary provider URL, always keep it at index 0
//   if (this.temporaryUrl) {
//     // Remove any existing occurrences of the temporary URL
//     const otherUrls = normalizedUrls.filter(url => url !== this.temporaryUrl);
//     return [this.temporaryUrl, ...otherUrls];
//   }

//   // Otherwise, process URLs normally
//   const providerUrls = normalizedUrls.filter(url => this.isProviderUrl(url));
//   const storageUrls = normalizedUrls
//     .filter(url => !this.isProviderUrl(url))
//     .sort((a, b) => {
//       const getTimestamp = (url: string) => {
//         const match = url.match(/\/(\d+)-/);
//         return match ? parseInt(match[1]) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   return [...storageUrls, ...providerUrls];
// }

// Main method
// private processUrlArray(urls: string[], userId: string): string[] {
//   // First normalize all URLs
//   const normalizedUrls = urls.map(url => {
//     if (url.startsWith('blob:')) {
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // If there's a temporary provider URL, always keep it at index 0
//   if (this.temporaryUrl) {
//     const otherUrls = normalizedUrls.filter(url => url !== this.temporaryUrl);
//     return [this.temporaryUrl, ...otherUrls];
//   }

//   // Split into provider and storage URLs
//   const providerUrls = normalizedUrls.filter(url => this.isProviderUrl(url));
//   const storageUrls = normalizedUrls
//     .filter(url => !this.isProviderUrl(url))
//     .sort((a, b) => {
//       const getTimestamp = (u: string) => {
//         const match = u.match(/\/(\d+)-/);
//         return match ? parseInt(match[1], 10) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   let finalArray = [...storageUrls, ...providerUrls];

//   // If the current profile image is a provider URL, ensure it is at the front
//   // This handles scenario 2: the current provider image (Unsplash) should appear first when entering change picture state.
//   if (this.isProviderProfile && this.currentProfilePath) {
//     const providerFirst = finalArray.filter(url => url === this.currentProfilePath);
//     const rest = finalArray.filter(url => url !== this.currentProfilePath);
//     if (providerFirst.length > 0) {
//       finalArray = [...providerFirst, ...rest];
//     }
//   }

//   return finalArray;
// }

private processUrlArray(urls: string[], userId: string): string[] {
  // First normalize all URLs
  const normalizedUrls = urls.map(url => {
    if (url.startsWith('blob:')) {
      const pathMatch = url.match(/\/([^/]+)$/);
      if (pathMatch) {
        return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
      }
    }
    return url;
  });

  // If there's a temporary provider URL, it takes highest priority
  if (this.temporaryUrl) {
    const otherUrls = normalizedUrls.filter(url => url !== this.temporaryUrl);
    return [this.temporaryUrl, ...otherUrls];
  }

  // Split into provider and storage URLs
  const providerUrls = normalizedUrls.filter(url => this.isProviderUrl(url));
  const storageUrls = normalizedUrls
    .filter(url => !this.isProviderUrl(url))
    .sort((a, b) => {
      const getTimestamp = (u: string) => {
        const match = u.match(/\/(\d+)-/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getTimestamp(a) - getTimestamp(b);
    });

  let finalArray = [...storageUrls, ...providerUrls];

  // Handle current provider profile image priority
  if (this.isProviderProfile && this.currentProfilePath) {
    const providerFirst = finalArray.filter(url => url === this.currentProfilePath);
    const rest = finalArray.filter(url => url !== this.currentProfilePath);
    if (providerFirst.length > 0) {
      finalArray = [...providerFirst, ...rest];
    }
  }

  return finalArray;
}

// private processUrlArray(urls: string[], userId: string): string[] {
//   // First normalize all URLs
//   const normalizedUrls = urls.map(url => {
//     if (url.startsWith('blob:')) {
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // If this is the current profile image and it's a provider URL,
//   // it should always be first
//   if (this.currentProfilePath && this.isProviderUrl(this.currentProfilePath)) {
//     // Filter out the current profile URL if it exists in the array
//     const otherUrls = normalizedUrls.filter(url => url !== this.currentProfilePath);
//     // Put the current profile URL first
//     return [this.currentProfilePath, ...otherUrls];
//   }

//   // If there's a temporary provider URL and we're not showing a provider profile,
//   // keep it at index 0
//   if (this.temporaryUrl && !this.isProviderProfile) {
//     const otherUrls = normalizedUrls.filter(url => url !== this.temporaryUrl);
//     return [this.temporaryUrl, ...otherUrls];
//   }

//   // Split into provider and storage URLs
//   const storageUrls = normalizedUrls
//     .filter(url => !this.isProviderUrl(url))
//     .sort((a, b) => {
//       const getTimestamp = (u: string) => {
//         const match = u.match(/\/(\d+)-/);
//         return match ? parseInt(match[1], 10) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   // If we get here, just return Firebase URLs in order
//   return storageUrls;
// }

// private processUrlArray(urls: string[], userId: string): string[] {
//   // Extract current profile URL if it exists
//   const currentProfileUrl = this.currentProfilePath;
  
//   // Remove current profile URL from the array if it exists
//   const otherUrls = currentProfileUrl ? 
//     urls.filter(url => this.normalizeUrl(url) !== this.normalizeUrl(currentProfileUrl)) : 
//     [...urls];
  
//   // Sort firebase storage URLs by timestamp
//   const storageUrls = otherUrls
//     .filter(url => !this.isProviderUrl(url))
//     .sort((a, b) => {
//       const getTimestamp = (url: string) => {
//         const match = url.match(/\/(\d+)-/);
//         return match ? parseInt(match[1]) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   // Get provider URLs (excluding current profile if it's a provider URL)
//   const providerUrls = otherUrls
//     .filter(url => this.isProviderUrl(url));

//   // Combine arrays with current profile URL first
//   return currentProfileUrl ? 
//     [currentProfileUrl, ...storageUrls, ...providerUrls] : 
//     [...storageUrls, ...providerUrls];
// }

// private processUrlArray(urls: string[], userId: string): string[] {
//   // First normalize all URLs
//   const normalizedUrls = urls.map(url => {
//     if (url.startsWith('blob:')) {
//       const pathMatch = url.match(/\/([^/]+)$/);
//       if (pathMatch) {
//         return `${environment.apiUrl}/api/storage/profileImages/${userId}/${pathMatch[1]}`;
//       }
//     }
//     return url;
//   });

//   // If there's a temporary provider URL, always keep it at index 0
//   if (this.temporaryUrl) {
//     // Remove any existing occurrences of the temporary URL
//     const otherUrls = normalizedUrls.filter(url => url !== this.temporaryUrl);
//     return [this.temporaryUrl, ...otherUrls];
//   }

//   // Otherwise, process URLs normally
//   const providerUrls = normalizedUrls.filter(url => this.isProviderUrl(url));
//   const storageUrls = normalizedUrls
//     .filter(url => !this.isProviderUrl(url))
//     .sort((a, b) => {
//       const getTimestamp = (url: string) => {
//         const match = url.match(/\/(\d+)-/);
//         return match ? parseInt(match[1]) : 0;
//       };
//       return getTimestamp(a) - getTimestamp(b);
//     });

//   return [...storageUrls, ...providerUrls];
// }

private async verifyImageUrl(url: string): Promise<boolean> {
  try {
    if (this.isProviderUrl(url)) {
      return true; // Assume provider URLs are valid
    }

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

// nextImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
//   this.hasStartedNavigating = true;
  
//   // Process URLs to ensure correct order and format
//   const processedUrls = this.processUrlArray(current.urls, userId);
  
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: processedUrls.length,
//     currentUrl: processedUrls[current.currentIndex],
//     nextUrl: processedUrls[newIndex]
//   });
  
//   subject.next({
//     urls: processedUrls,
//     currentIndex: newIndex
//   });
// }

// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
//   this.hasStartedNavigating = true;
  
//   // Process URLs to ensure correct order and format
//   const processedUrls = this.processUrlArray(current.urls, userId);
  
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: processedUrls.length,
//     currentUrl: processedUrls[current.currentIndex],
//     nextUrl: processedUrls[newIndex]
//   });
  
//   subject.next({
//     urls: processedUrls,
//     currentIndex: newIndex
//   });
// }

// nextImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate new index
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
//   this.hasStartedNavigating = true;
  
//   // Process URLs while maintaining order
//   const processedUrls = this.processUrlArray(current.urls, userId);
  
//   // Log navigation state for debugging
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: processedUrls.length,
//     currentUrl: processedUrls[current.currentIndex],
//     nextUrl: processedUrls[newIndex],
//     isProviderProfile: this.isProviderProfile
//   });
  
//   // Update state
//   subject.next({
//     urls: processedUrls,
//     currentIndex: newIndex
//   });
// }

// // Modified previousImage to maintain correct URL order and index
// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate new index
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
//   this.hasStartedNavigating = true;
  
//   // Process URLs while maintaining order
//   const processedUrls = this.processUrlArray(current.urls, userId);
  
//   // Log navigation state for debugging
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: processedUrls.length,
//     currentUrl: processedUrls[current.currentIndex],
//     nextUrl: processedUrls[newIndex],
//     isProviderProfile: this.isProviderProfile
//   });
  
//   // Update state
//   subject.next({
//     urls: processedUrls,
//     currentIndex: newIndex
//   });
// }


// nextImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate new index
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
//   this.hasStartedNavigating = true;

//   // Get the ordered URLs that were set in loadUserImages
//   const orderedUrls = this.processUrlArray([...current.urls], userId);
  
//   // Ensure indexes match the ordered array
//   const currentUrl = orderedUrls[current.currentIndex];
//   const nextUrl = orderedUrls[newIndex];
  
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: orderedUrls.length,
//     currentUrl,
//     nextUrl,
//     isProviderProfile: this.isProviderProfile
//   });
  
//   // Update state with ordered URLs
//   subject.next({
//     urls: orderedUrls,
//     currentIndex: newIndex
//   });
// }

// // Modified previousImage to maintain URL order from loadUserImages
// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate new index
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
//   this.hasStartedNavigating = true;

//   // Get the ordered URLs that were set in loadUserImages
//   const orderedUrls = this.processUrlArray([...current.urls], userId);
  
//   // Ensure indexes match the ordered array
//   const currentUrl = orderedUrls[current.currentIndex];
//   const nextUrl = orderedUrls[newIndex];
  
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: orderedUrls.length,
//     currentUrl,
//     nextUrl,
//     isProviderProfile: this.isProviderProfile
//   });
  
//   // Update state with ordered URLs
//   subject.next({
//     urls: orderedUrls,
//     currentIndex: newIndex
//   });
// }

// async nextImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate new index
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
//   this.hasStartedNavigating = true;

//   // Process URLs to maintain correct order
//   const processedUrls = await Promise.all(current.urls.map(async url => {
//     // Convert Firebase URLs to API URLs
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return await this.storageService.convertFirebaseUrl(url);
//     }
//     // Keep provider URLs as-is
//     if (this.isProviderUrl(url)) {
//       return url;
//     }
//     return url;
//   }));

//   // Order URLs consistently
//   const orderedUrls = this.processUrlArray(processedUrls, userId);
  
//   // Update state with ordered URLs
//   subject.next({
//     urls: orderedUrls,
//     currentIndex: newIndex
//   });

//   // Log state for debugging
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: orderedUrls.length,
//     currentUrl: orderedUrls[current.currentIndex],
//     nextUrl: orderedUrls[newIndex],
//     isProvider: this.isProviderUrl(orderedUrls[newIndex])
//   });
// }

// // Similarly update previousImage
// async previousImage(userId: string): Promise<void> {
//   // Same logic as nextImage but with reverse index calculation
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
//   this.hasStartedNavigating = true;

//   const processedUrls = await Promise.all(current.urls.map(async url => {
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return await this.storageService.convertFirebaseUrl(url);
//     }
//     if (this.isProviderUrl(url)) {
//       return url;
//     }
//     return url;
//   }));

//   const orderedUrls = this.processUrlArray(processedUrls, userId);
  
//   subject.next({
//     urls: orderedUrls,
//     currentIndex: newIndex
//   });
// }

// Latest working
// async nextImage(userId: string): Promise<void> {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   // Calculate new index
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
//   this.hasStartedNavigating = true;

//   // Process URLs to maintain correct order
//   const processedUrls = await Promise.all(current.urls.map(async url => {
//     // Convert Firebase URLs to API URLs
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return await this.storageService.convertFirebaseUrl(url);
//     }
//     // Keep provider URLs as-is
//     if (this.isProviderUrl(url)) {
//       return url;
//     }
//     return url;
//   }));

//   // Order URLs consistently
//   const orderedUrls = this.processUrlArray(processedUrls, userId);
  
//   // Update state with ordered URLs
//   subject.next({
//     urls: orderedUrls,
//     currentIndex: newIndex
//   });

//   // Log state for debugging
//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: orderedUrls.length,
//     currentUrl: orderedUrls[current.currentIndex],
//     nextUrl: orderedUrls[newIndex],
//     isProvider: this.isProviderUrl(orderedUrls[newIndex])
//   });
// }

// Latest WOrking
// async previousImage(userId: string): Promise<void> {
//   // Same logic as nextImage but with reverse index calculation
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
//   this.hasStartedNavigating = true;

//   const processedUrls = await Promise.all(current.urls.map(async url => {
//     if (url.includes('firebasestorage.googleapis.com')) {
//       return await this.storageService.convertFirebaseUrl(url);
//     }
//     if (this.isProviderUrl(url)) {
//       return url;
//     }
//     return url;
//   }));

//   const orderedUrls = this.processUrlArray(processedUrls, userId);
  
//   subject.next({
//     urls: orderedUrls,
//     currentIndex: newIndex
//   });
// }

// Main Method
// nextImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;
  
//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex + 1) % current.urls.length;
//   this.hasStartedNavigating = true;

//   // Just update currentIndex, do not re-derive or reprocess URLs
//   subject.next({
//     urls: current.urls,
//     currentIndex: newIndex
//   });

//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length,
//     currentUrl: current.urls[newIndex]
//   });
// }

nextImage(userId: string): void {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;
  
  if (current.urls.length <= 1) return;
  
  let newIndex = (current.currentIndex + 1) % current.urls.length;
  
  // If we're cycling back to start and have provider URLs
  if (newIndex === 0 && this.temporaryUrl) {
    const providerUrls = current.urls.filter(url => this.isProviderUrl(url));
    if (providerUrls.length > 0) {
      newIndex = current.urls.findIndex(url => url === providerUrls[0]);
    }
  }

  this.hasStartedNavigating = true;

  subject.next({
    urls: current.urls,
    currentIndex: newIndex
  });
}

private ensureValidIndex(index: number, urls: string[]): number {
  if (urls.length === 0) return 0;
  if (this.isProviderProfile) return 0;
  return Math.max(0, Math.min(index, urls.length - 1));
}

// Main method
// previousImage(userId: string): void {
//   const subject = this.getUserImagesSubject(userId);
//   const current = subject.value;

//   if (current.urls.length <= 1) return;
  
//   const newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
//   this.hasStartedNavigating = true;

//   // Just update currentIndex, do not re-derive or reprocess URLs
//   subject.next({
//     urls: current.urls,
//     currentIndex: newIndex
//   });

//   console.log('Navigation state:', {
//     previousIndex: current.currentIndex,
//     newIndex,
//     totalImages: current.urls.length,
//     currentUrl: current.urls[newIndex]
//   });
// }

previousImage(userId: string): void {
  const subject = this.getUserImagesSubject(userId);
  const current = subject.value;

  if (current.urls.length <= 1) return;
  
  let newIndex = (current.currentIndex - 1 + current.urls.length) % current.urls.length;
  
  // If we're cycling back to end and have provider URLs
  if (newIndex === current.urls.length - 1 && this.temporaryUrl) {
    const providerUrls = current.urls.filter(url => this.isProviderUrl(url));
    if (providerUrls.length > 0) {
      newIndex = current.urls.findIndex(url => url === providerUrls[0]);
    }
  }

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
    isProviderProfile: this.isProviderProfile,
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
}