import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductStatusService {
  private limitReachedProducts = new BehaviorSubject<Set<string>>(new Set<string>());

  setLimitReached(productId: string, isLimitReached: boolean) {
    const currentSet = new Set(this.limitReachedProducts.value);
    if (isLimitReached) {
      currentSet.add(productId);
    } else {
      currentSet.delete(productId);
    }
    this.limitReachedProducts.next(currentSet);
  }

  isLimitReached(productId: string) {
    return this.limitReachedProducts.value.has(productId);
  }

  getLimitReachedProducts() {
    return this.limitReachedProducts.asObservable();
  }

  getButtonText(productId: string): string {
    return this.isLimitReached(productId) ? 'Limit Reached' : 'Add to Cart';
  }
}