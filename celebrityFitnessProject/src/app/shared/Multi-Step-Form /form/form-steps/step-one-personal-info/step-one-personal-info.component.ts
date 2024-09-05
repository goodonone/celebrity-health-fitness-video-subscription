import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';
import { FormService } from '../../form.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-step-one-personal-info',
  templateUrl: './step-one-personal-info.component.html',
  styleUrls: ['./step-one-personal-info.component.css'],
})

export class StepOnePersonalInfoComponent implements OnInit {
  stepForm!: FormGroup;

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  @Input() formGroupName!: string;
  passwordMismatch: boolean = false;
  isPopupVisible: boolean = false;
  passwordVisible = false;

  private destroy$ = new Subject<void>();


  constructor(private inputFormGroup: FormGroupDirective, private fb: FormBuilder, public formService: FormService, private cdr: ChangeDetectorRef) { }


  ngOnInit(): void {
    // this.stepForm = this.inputFormGroup.control.get(this.formGroupName) as FormGroup;
    this.stepForm = this.formService.multiStepForm.get('personalDetails') as FormGroup;
    

   // Subscribe to changes in the password and confirmPassword fields
    // this.stepForm.get('password')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });

    // this.stepForm.get('confirmPassword')?.valueChanges.subscribe(() => {
    //   this.checkPasswords();
    // });
    this.stepForm.get('confirmPassword')?.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.checkPasswords());

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  // validatePasswords(): void {
  //   const password = this.formService.multiStepForm.get('personalDetails.password')?.value;
  //   const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

  //   this.passwordMissmatch = password !== confirmPassword;
  // }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

   // Check password mismatch
  //  checkPasswords() {
  //   const password = this.stepForm.get('password')?.value;
  //   const confirmPassword = this.stepForm.get('confirmPassword')?.value;


  // this.passwordMismatch = password !== confirmPassword;

  // if (this.passwordMismatch) {
  //   this.stepForm.get('confirmPassword')?.setErrors({ mismatch: true });
  // } else {
  //   this.stepForm.get('confirmPassword')?.setErrors(null);
  // }
  // }
  checkPasswords() {
    const password = this.stepForm.get('password')?.value;
    const confirmPassword = this.stepForm.get('confirmPassword')?.value;

    if (confirmPassword === '') {
      // Don't show mismatch error if confirm password is empty
      this.passwordMismatch = false;
      this.stepForm.get('confirmPassword')?.setErrors(null);
    } else if (password !== confirmPassword) {
      this.passwordMismatch = true;
      this.stepForm.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      this.passwordMismatch = false;
      this.stepForm.get('confirmPassword')?.setErrors(null);
    }
  }

  // Show and hide password popup
  showPasswordPopup() {
    this.isPopupVisible = true;
  }

  hidePasswordPopup() {
    this.isPopupVisible = false;
  }

  // Prevent copy and paste in confirm password field
  preventCopyPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }


}


