// import { AbstractControl, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator() {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalidFormat': true };
//     }

//     const [month, year] = value.split('/');
//     const expMonth = parseInt(month, 10);
//     const expYear = parseInt(year, 10);

//     if (expMonth < 1 || expMonth > 12) {
//       return { 'invalidFormat': true };
//     }

//     const currentYear = new Date().getFullYear() % 100;
//     if (expYear < currentYear || expYear > currentYear + 20) {
//       return { 'invalidFormat': true };
//     }

//     return null;
//   };
// }

// import { AbstractControl, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator(): (control: AbstractControl) => ValidationErrors | null {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalidFormat': true };
//     }

//     const [month, year] = value.split('/');
//     const expMonth = parseInt(month, 10);
//     const expYear = parseInt(year, 10);

//     if (expMonth < 1 || expMonth > 12) {
//       return { 'invalidFormat': true };
//     }

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear() % 100;
//     const currentMonth = currentDate.getMonth() + 1;

//     if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
//       return { 'expiredDate': true };
//     }

//     if (expYear > currentYear + 20) {
//       return { 'invalidFormat': true };
//     }

//     return null;
//   };
// }

// import { AbstractControl, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator(control: AbstractControl): ValidationErrors | null {
//   const value = control.value;
//   if (!value) {
//     return null;
//   }

//   if (!/^\d{2}\/\d{2}$/.test(value)) {
//     return { 'invalidFormat': true };
//   }

//   const [month, year] = value.split('/');
//   const expMonth = parseInt(month, 10);
//   const expYear = parseInt(year, 10);

//   if (expMonth < 1 || expMonth > 12) {
//     return { 'invalidFormat': true };
//   }

//   const currentDate = new Date();
//   const currentYear = currentDate.getFullYear() % 100;
//   const currentMonth = currentDate.getMonth() + 1;

//   if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
//     return { 'expiredDate': true };
//   }

//   if (expYear > currentYear + 20) {
//     return { 'invalidFormat': true };
//   }

//   return null;
// }

// import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator(): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalidFormat': true };
//     }

//     const [month, year] = value.split('/');
//     const expMonth = parseInt(month, 10);
//     const expYear = parseInt(year, 10);

//     if (expMonth < 1 || expMonth > 12) {
//       return { 'invalidFormat': true };
//     }

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear() % 100;
//     const currentMonth = currentDate.getMonth() + 1;

//     if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
//       return { 'expiredDate': true };
//     }

//     if (expYear > currentYear + 20) {
//       return { 'invalidFormat': true };
//     }

//     return null;
//   };
// }

// import { AbstractControl, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator(control: AbstractControl): ValidationErrors | null {
//   const value = control.value;
//   if (!value) {
//     return null;
//   }

//   if (!/^\d{2}\/\d{2}$/.test(value)) {
//     return { invalidFormat: true };
//   }

//   const [month, year] = value.split('/');
//   const expMonth = parseInt(month, 10);
//   const expYear = parseInt(year, 10) + 2000; // Assume 20xx

//   if (expMonth < 1 || expMonth > 12) {
//     return { invalidFormat: true };
//   }

//   const currentDate = new Date();
//   const currentYear = currentDate.getFullYear();
//   const currentMonth = currentDate.getMonth() + 1;

//   if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
//     return { expiredDate: true };
//   }

//   if (expYear > currentYear + 20) {
//     return { invalidFormat: true };
//   }

//   return null;
// }

// import { AbstractControl, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator(control: AbstractControl): ValidationErrors | null {
//   const value = control.value;
//   if (!value) {
//     return null;
//   }

//   if (!/^\d{2}\/\d{2}$/.test(value)) {
//     return { invalidFormat: true };
//   }

//   const [month, year] = value.split('/');
//   const expMonth = parseInt(month, 10);
//   const expYear = parseInt(year, 10) + 2000; // Assume 20xx

//   if (expMonth < 1 || expMonth > 12) {
//     return { invalidFormat: true };
//   }

//   const currentDate = new Date();
//   const currentYear = currentDate.getFullYear();
//   const currentMonth = currentDate.getMonth() + 1;

//   if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
//     return { expiredDate: true };
//   }

//   if (expYear > currentYear + 20) {
//     return { invalidFormat: true };
//   }

//   return null;
// }

// import { AbstractControl, ValidationErrors } from '@angular/forms';

// export function expirationDateValidator(control: AbstractControl): ValidationErrors | null {
//   const value = control.value;
//   if (!value) {
//     return null;
//   }

//   // Improved regex to ensure exactly two digits for month and year
//   if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
//     return { invalidFormat: true };
//   }

//   const [month, year] = value.split('/');
//   const expMonth = parseInt(month, 10);
//   const expYear = parseInt(year, 10) + 2000; // Assume 20xx

//   const currentDate = new Date();
//   const currentYear = currentDate.getFullYear();
//   const currentMonth = currentDate.getMonth() + 1;

//   // Check if the date is in the past
//   if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
//     return { expiredDate: true };
//   }

//   // Check if the date is too far in the future (more than 10 years)
//   if (expYear > currentYear + 10) {
//     return { dateTooFarInFuture: true };
//   }

//   return null;
// }

import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export function expirationDateValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (!value) {
      return of(null);
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
      return of({ invalidFormat: true });
    }

    const [month, year] = value.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10) + 2000; // Assume 20xx

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return of({ expiredDate: true });
    }

    if (expYear > currentYear + 10) {
      return of({ dateTooFarInFuture: true });
    }

    return of(null).pipe(delay(100)); // Simulate async operation
  };
}