// upload-state.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadStateService {
  private uploadingNewSource = new Subject<boolean>();
  uploadingNew$ = this.uploadingNewSource.asObservable();

  setUploadingNew(value: boolean) {
    this.uploadingNewSource.next(value);
  }
}