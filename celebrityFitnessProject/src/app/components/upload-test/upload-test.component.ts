import { Component, OnInit } from '@angular/core';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../firebase.config';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-upload-test',
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Firebase Storage Upload Test</h2>
      
      <div class="mb-4 p-2 border rounded">
        <p>Authentication Status: {{ isAuthenticated ? 'Logged In' : 'Not Logged In' }}</p>
        <p>User ID: {{ userId || 'None' }}</p>
        <div class="mt-2">
          <button 
            (click)="refreshAuth()" 
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Auth
          </button>
        </div>
      </div>

      <div class="mb-4">
        <input 
          #fileInput
          type="file" 
          accept="image/*"
          (change)="onFileSelected($event)"
          [disabled]="isUploading"
          class="mb-2"
        >
      </div>

      <div *ngIf="isUploading" class="mb-4">
        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div class="bg-blue-600 h-2.5 rounded-full" [style.width.%]="uploadProgress"></div>
        </div>
        <p class="mt-2">Upload Progress: {{ uploadProgress }}%</p>
      </div>

      <div *ngIf="uploadError" class="mb-4 p-2 bg-red-100 text-red-700 rounded">
        {{ uploadError }}
      </div>

      <div *ngIf="uploadedImageUrl" class="mt-4">
        <h3 class="font-bold mb-2">Uploaded Image:</h3>
        <img [src]="uploadedImageUrl" alt="Uploaded image" class="max-w-xs rounded shadow">
        <p class="mt-2 text-sm break-all text-gray-600">URL: {{ uploadedImageUrl }}</p>
      </div>
    </div>
  `
})
export class UploadTestComponent implements OnInit {
  isUploading = false;
  uploadError = '';
  uploadedImageUrl = '';
  uploadProgress = 0;
  isAuthenticated = false;
  userId: string | null = null;

  constructor(private userService: UserService) {}

  async ngOnInit() {
    await this.checkAuthStatus();
  }

  private async checkAuthStatus() {
    this.isAuthenticated = !!auth.currentUser;
    this.userId = auth.currentUser?.uid || null;
    console.log('Auth Status:', { isAuthenticated: this.isAuthenticated, userId: this.userId });
  }

  async refreshAuth() {
    try {
      await this.userService.refreshFirebaseAuth();
      await this.checkAuthStatus();
      console.log('Auth refreshed successfully');
    } catch (error) {
      console.error('Auth refresh failed:', error);
      this.uploadError = 'Authentication refresh failed';
    }
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      if (!auth.currentUser) {
        await this.refreshAuth();
        if (!auth.currentUser) {
          throw new Error('Please log in to upload files');
        }
      }

      this.isUploading = true;
      this.uploadError = '';
      this.uploadProgress = 0;

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Create file reference
      const fileName = `uploads/${auth.currentUser.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file with progress monitoring
      const uploadTask = uploadBytes(storageRef, file);
      
      uploadTask.then(async (snapshot) => {
        console.log('Upload successful:', snapshot);
        this.uploadProgress = 100;
        
        // Get download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        console.log('File available at:', downloadUrl);
        
        this.uploadedImageUrl = downloadUrl;
      }).catch((error) => {
        console.error('Upload failed:', error);
        this.uploadError = error instanceof Error ? error.message : 'Upload failed';
      }).finally(() => {
        this.isUploading = false;
      });

    } catch (error) {
      console.error('Upload failed:', error);
      this.uploadError = error instanceof Error ? error.message : 'Upload failed';
      this.isUploading = false;
    }
  }
}