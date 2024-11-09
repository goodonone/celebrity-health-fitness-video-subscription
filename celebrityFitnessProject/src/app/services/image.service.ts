// src/app/services/image.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private baseUrl = 'http://localhost:3000'; // Adjust to your API base URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  async uploadImage(file: File, userId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const authToken = await this.authService.getToken();

    if (!authToken) {
      throw new Error('User is not authenticated');
    }

    const response = await firstValueFrom(
      this.http.post<any>(
        `${this.baseUrl}/api/images/upload/${userId}`,
        formData,
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${authToken}`,
          }),
        }
      )
    );

    if (response.success) {
      return response.downloadURL;
    } else {
      throw new Error(response.message || 'Error uploading file');
    }
  }
}