// import { AbstractControl, ValidationErrors } from '@angular/forms';
// import { Observable, of } from 'rxjs';

// export function expirationDateValidator(): (control: AbstractControl) => Observable<ValidationErrors | null> {
//   return (control: AbstractControl): Observable<ValidationErrors | null> => {
//     const value = control.value;
//     if (!value) {
//       return of(null); // Valid when no value is present
//     }

//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return of({ 'invalid': true });
//     }

//     const [monthStr, yearStr] = value.split('/');
//     const month = parseInt(monthStr, 10);
//     let year = parseInt(yearStr, 10);

//     if (month < 1 || month > 12) {
//       return of({ 'invalid': true });
//     }

//     const currentYear = 2027;
//     year += 2000;

//     if (year < currentYear || (year === currentYear && month < (new Date().getMonth() + 1))) {
//       return of({ 'expiredDate': true });
//     }

//     if (year > currentYear + 20) {
//       return of({ 'invalid': true });
//     }

//     return of(null);
//   };
// }

// import { AbstractControl, ValidationErrors } from '@angular/forms';
// import { Observable, of } from 'rxjs';

// export function expirationDateValidator(): (control: AbstractControl) => Observable<ValidationErrors | null> {
//   return (control: AbstractControl): Observable<ValidationErrors | null> => {
//     const value = control.value;
//     if (!value) {
//       return of(null);
//     }

//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return of({ 'invalid': true });
//     }

//     const [monthStr, yearStr] = value.split('/');
//     const month = parseInt(monthStr, 10);
//     let year = parseInt(yearStr, 10) + 2000;

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth() + 1;

//     if (month < 1 || month > 12) {
//       return of({ 'invalid': true });
//     }

//     if (year < currentYear || (year === currentYear && month < currentMonth)) {
//       return of({ 'expiredDate': true });
//     }

//     if (year > currentYear + 20) {
//       return of({ 'invalid': true });
//     }

//     return of(null);
//   };
// }

import { AbstractControl, ValidationErrors } from '@angular/forms';

export function expirationDateValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    if (!/^\d{2}\/\d{2}$/.test(value)) {
      return { 'invalidFormat': true };
    }

    const [month, year] = value.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);

    if (expMonth < 1 || expMonth > 12) {
      return { 'invalidFormat': true };
    }

    const currentYear = new Date().getFullYear() % 100;
    if (expYear < currentYear || expYear > currentYear + 20) {
      return { 'invalidFormat': true };
    }

    return null;
  };
}