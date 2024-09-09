// import { AbstractControl, ValidatorFn } from '@angular/forms';

// export function expirationDateValidator(): ValidatorFn {
//   return (control: AbstractControl): {[key: string]: any} | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }
//     const [month, year] = value.split('/');
//     const expirationDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
//     const today = new Date();
//     if (expirationDate < today) {
//       return { 'expiredDate': true };
//     }
//     return null;
//   };
// }

// import { AbstractControl, ValidatorFn } from '@angular/forms';

// export function expirationDateValidator(): ValidatorFn {
//   return (control: AbstractControl): {[key: string]: any} | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     // Check if the format is correct
//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalidFormat': true };
//     }

//     const [month, year] = value.split('/').map(Number);

//     // Check if month is valid (01-12)
//     if (month < 1 || month > 12) {
//       return { 'invalidMonth': true };
//     }

//     const today = new Date();
//     const currentYear = today.getFullYear() % 100; // Get last two digits of current year
//     const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11

//     // Check if the year is in the past
//     if (year < currentYear) {
//       return { 'expiredDate': true };
//     }

//     // Check if the year is too far in the future (more than 20 years)
//     if (year > currentYear + 20) {
//       return { 'invalidYear': true };
//     }

//     // If it's the current year, check if the month is in the past or current
//     if (year === currentYear && month < currentMonth) {
//       return { 'expiredDate': true };
//     }

//     return null;
//   };
// }



// import { AbstractControl, ValidatorFn } from '@angular/forms';

// export function expirationDateValidator(): ValidatorFn {
//   return (control: AbstractControl): {[key: string]: any} | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     // Check if the format is correct
//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalidFormat': true };
//     }

//     const [month, yearStr] = value.split('/');
//     const monthNum = parseInt(month, 10);
//     let yearNum = parseInt(yearStr, 10);

//     // Check if month is valid (01-12)
//     if (monthNum < 1 || monthNum > 12) {
//       return { 'invalid': true };
//     }

//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

//     // Adjust year to four digits
//     yearNum += yearNum < 100 ? 2000 : 1900;

//     // Check if the date is in the past
//     if (yearNum < currentYear || (yearNum === currentYear && monthNum <= currentMonth)) {
//       return { 'expiredDate': true };
//     }

//     // Check if the year is too far in the future (more than 20 years)
//     if (yearNum > currentYear + 20) {
//       return { 'invalid': true };
//     }

//     return null;
//   };
// }

// import { AbstractControl, ValidatorFn } from '@angular/forms';

// export function expirationDateValidator(): ValidatorFn {
//   return (control: AbstractControl): {[key: string]: any} | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     // Check if the format is correct
//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalid': true };
//     }

//     const [monthStr, yearStr] = value.split('/');
//     const month = parseInt(monthStr, 10);
//     let year = parseInt(yearStr, 10);

//     // Check if month is valid (01-12)
//     if (month < 1 || month > 12) {
//       return { 'invalid': true };
//     }

//     // Adjust year to four digits
//     year += year < 100 ? 2000 : 1900;

//     // Create a Date object for the last day of the input month
//     const inputDate = new Date(year, month, 0);  // This creates the last day of the given month
    
//     // Create a Date object for the current date
//     const currentDate = new Date();
    
//     // Set the time to the end of the day for both dates to ensure accurate comparison
//     inputDate.setHours(23, 59, 59, 999);
//     currentDate.setHours(23, 59, 59, 999);

//     // Check if the input date is before or equal to the current date
//     if (inputDate <= currentDate) {
//       return { 'expiredDate': true };
//     }

//     // Check if the year is too far in the future (more than 20 years)
//     if (year > currentDate.getFullYear() + 20) {
//       return { 'invalid': true };
//     }

//     return null;
//   };
// }


// import { AbstractControl, ValidatorFn } from '@angular/forms';

// export function expirationDateValidator(): ValidatorFn {
//   return (control: AbstractControl): {[key: string]: any} | null => {
//     const value = control.value;
//     if (!value) {
//       return null;
//     }

//     // Check if the format is correct
//     if (!/^\d{2}\/\d{2}$/.test(value)) {
//       return { 'invalid': true };
//     }

//     const [monthStr, yearStr] = value.split('/');
//     const month = parseInt(monthStr, 10);
//     let year = parseInt(yearStr, 10);

//     // Check if month is valid (01-12)
//     if (month < 1 || month > 12) {
//       return { 'invalid': true };
//     }

//     // Adjust year to four digits
//     // If year is less than 27 (2027), assume it's in the 2100s, otherwise in the 2000s
//     year += year < 27 ? 2100 : 2000;

//     const currentYear = 2027;
//     const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)

//     // Check if the card is expired
//     if (year <= currentYear) {
//       return { 'expiredDate': true };
//     }

//     // Check if the year is too far in the future (more than 20 years from 2027)
//     if (year > currentYear + 20) {
//       return { 'invalid': true };
//     }

//     return null;
//   };
// }


import { AbstractControl, ValidatorFn } from '@angular/forms';

export function expirationDateValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    // Check if the format is correct
    if (!/^\d{2}\/\d{2}$/.test(value)) {
      return { 'invalid': true };
    }

    const [monthStr, yearStr] = value.split('/');
    const month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);

    // Check if month is valid (01-12)
    if (month < 1 || month > 12) {
      return { 'invalid': true };
    }

    const currentYear = 2027;

    // Adjust year to four digits
    // Always interpret as 20xx, since we're in 2027
    year += 2000;

    // Check if the card is expired (anything before 2027 is expired)
    if (year < currentYear) {
      return { 'expiredDate': true };
    }

    // If it's 2027, check the month
    if (year === currentYear) {
      const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
      if (month < currentMonth) {
        return { 'expiredDate': true };
      }
    }

    // Check if the year is too far in the future (more than 20 years from 2027)
    if (year > currentYear + 20) {
      return { 'invalid': true };
    }

    return null;
  };
}