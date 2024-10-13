import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormService } from './form.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
})

export class FormComponent implements OnInit {
  stepForm!: FormGroup;
  activeStep$?: number;
  
  
  @Input() loggedIn!: boolean;
  @Input() payment!: boolean;
  @Input() checkout!: boolean;
  @Input() shipping!: boolean;
  @Input() tierTwoThree!: boolean;
  @Output() loadingStateChange = new EventEmitter<boolean>();

  constructor(private formService: FormService) {
    console.log('FormComponent constructor called');
   }

  ngOnInit(): void {
    this.stepForm = this.formService.stepForm;

    this.formService.activeStep$.subscribe(
      step => this.activeStep$ = step
    );

    this.formService.getTierAndBilling();

    console.log('FormComponent: tierTwoThree value received:', this.tierTwoThree);

    console.log("FormComponent INITIALIZED")
    this.preloadImage();
  }

  confirmAndSubmitForm() {
    this.formService.submit();
  }

  updateActiveStep(step: number) {
    this.formService.setActiveStep(step);
  }

  // private preloadImage() {
  //   console.log('Starting to preload image');
  //   this.loadingStateChange.emit(true);
  //   const img = new Image();
  //   img.src = 'assets/Images/alonso-reyes-0HlI76m4jxU-unsplash.jpg';
    
  //   img.onload = () => {
  //     console.log('Image loaded successfully');
  //     this.loadingStateChange.emit(false);
  //   };
    
  //   img.onerror = (error) => {
  //     console.error('Failed to load image:', error);
  //     this.loadingStateChange.emit(true); // Emit true even on error to prevent endless loading
  //   };
  
  //   setTimeout(() => {
  //     if (!img.complete) {
  //       console.log('Image is taking a long time to load');
  //       this.loadingStateChange.emit(false);
  //     }
  //   }, 500);
  
  //   console.log('Image src set to:', img.src);
  // }

  private preloadImage() {
    console.log('Starting to preload image');
    this.loadingStateChange.emit(true);
    const img = new Image();
    img.src = './assets/Images/alonso-reyes-0HlI76m4jxU-unsplash.jpg'; // Add leading slash
  
    img.onload = () => {
      console.log('Image loaded successfully');
      this.loadingStateChange.emit(false);
    };
  
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      this.loadingStateChange.emit(false); // Emit false to proceed even if image failed to load
    };
  
    setTimeout(() => {
      if (!img.complete) {
        console.log('Image is taking a long time to load');
        this.loadingStateChange.emit(false);
      }
    }, 500);
  
    console.log('Image src set to:', img.src);
  }
}
