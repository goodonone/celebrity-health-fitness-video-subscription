import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Payment } from '../models/payment';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  baseURL: string = "http://localhost:3000/api/payment"
  tokenKey: string = "token";

  constructor(private http: HttpClient) { }

  newPayment(newPayment: Payment): Observable<Payment> {
    console.log('|||||||||||||||||||||||| Sending payment data:', newPayment);
    return this.http.post<Payment>(`${this.baseURL}`, newPayment).pipe(
      tap(response => console.log('Payment created:', response)),
      catchError(error => {
        console.error('Error creating payment:', error);
        return throwError(() => new Error('Error creating payment'));
      })
    );
  }

  newPaymentStore(newPayment: Payment) {
    return this.http.post(`${this.baseURL}/store/`, newPayment);
  }

  // updatePayment(updatedPayment: Payment): Observable<Payment> {
  //   let reqHeaders = {
  //     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  //   }
  //   return this.http.put<Payment>(`${this.baseURL}/${updatedPayment.paymentId}`, updatedPayment);
  // }

  // getPaymentById(paymentId: string): Observable<Payment> {
  //   let reqHeaders = {
  //     Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
  //   }
  //   return this.http.get<Payment>(`${this.baseURL} /  ${paymentId}`, {headers: reqHeaders});
  //   }

  //   processPayment(paymentData: any): Observable<any> {
  //     return this.http.post(`${this.baseURL}/process`, paymentData);
  //   }
}
