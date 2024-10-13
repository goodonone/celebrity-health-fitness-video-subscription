import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductStatusService {
  private limitReachedProducts = new BehaviorSubject<Set<string>>(new Set<string>());
  private hoverStates = new Map<string, boolean>();
  private temporaryQuantities = new Map<string, number>();
  private productQuantities = new Map<string, number>();

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

  setHoverState(productId: string, isHovered: boolean) {
    this.hoverStates.set(productId, isHovered);
  }

  setTemporaryQuantity(productId: string, quantity: number) {
    this.temporaryQuantities.set(productId, quantity);
    setTimeout(() => {
      this.temporaryQuantities.delete(productId);
    }, 200);
  }
  setProductQuantity(productId: string, quantity: number) {
    this.productQuantities.set(productId, quantity);
  }

  getButtonText(productId: string): string {
    const quantity = this.productQuantities.get(productId) || 0;
    if (this.temporaryQuantities.has(productId) && quantity <= 10) {
      return `+${this.temporaryQuantities.get(productId)}`;
    }
    if (this.isLimitReached(productId) && this.hoverStates.get(productId)) {
      return 'Limit Reached';
    }
    return 'Add to Cart';
  }

  resetAllProductStatuses() {
    this.limitReachedProducts.next(new Set<string>());
    this.hoverStates.clear();
    this.temporaryQuantities.clear();
  }

  resetProductStatus(productId: string) {
    const currentSet = new Set(this.limitReachedProducts.value);
    currentSet.delete(productId);
    this.limitReachedProducts.next(currentSet);
    this.hoverStates.delete(productId);
    this.temporaryQuantities.delete(productId);
  }
}