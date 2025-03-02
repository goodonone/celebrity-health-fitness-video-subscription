import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductPositionService {
  // Map storing product IDs and their corresponding positions
  private productPositions: Map<string, number> = new Map<string, number>();

  // The key used to store positions in localStorage
  private readonly STORAGE_KEY = 'product_positions';
  
  // The position array (1-based index)
  private positionArray: string[] = [
    'center center',  // Position 1
    'center center',  // Position 2
    'center bottom',  // Position 3
    'center center',  // Position 4
    'center center',  // Position 5
    'center center',  // Position 6
    'center center',  // Position 7
    'center bottom',  // Position 8
    'center center',  // Position 9
    'center center',  // Position 10
    'center bottom',  // Position 11
    'center center'   // Position 12
  ];

  constructor() {
    console.log('ProductPositionService initialized');
    this.loadPositionsFromStorage();
  }

  // storeProductOrder(products: any[]): void {
  //   console.log('Storing product order:', products.map(p => p.productId));
    
  //   // Clear existing data
  //   this.productPositions.clear();
    
  //   // Store product positions (1-based indexing)
  //   products.forEach((product: any, index: any) => {
  //     const positionIndex = index + 1; // 1-based indexing
  //     this.productPositions.set(product.productId, positionIndex);
  //   });
  
  // }

  storeProductOrder(products: any[]): void {
    console.log('Storing product order:', products.map(p => p.productId));
    
    // Clear existing data
    this.productPositions.clear();
    
    // Store product positions (1-based indexing)
    products.forEach((product, index) => {
      const positionIndex = index + 1; // 1-based indexing
      this.productPositions.set(product.productId, positionIndex);
      console.log(`Stored: Product ${product.productId} -> Position ${positionIndex}`);
    });
    
    // Save to localStorage for persistence
    this.savePositionsToStorage();
    
    // Log all stored mappings
    console.log('All product position mappings:');
    this.productPositions.forEach((position, id) => {
      console.log(`  ID: ${id} -> Position: ${position}`);
    });
  }


  // getBackgroundPosition(productId: string): string {
  //   console.log(`Getting position for product ID: ${productId}`);
    
  //   // Check if we have a position for this product
  //   if (this.productPositions.has(productId)) {
  //     // Get the position index (1-12)
  //     const positionIndex: any = this.productPositions.get(productId) || 1;
  //     console.log(`Found position index: ${positionIndex}`);
      
  //     // Convert to 0-based index for the array
  //     const arrayIndex = (positionIndex - 1) % this.positionArray.length;
      
  //     // Get the CSS position
  //     const position = this.positionArray[arrayIndex];
  //     console.log(`Position ${positionIndex} maps to CSS: ${position}`);
      
  //     return position;
  //   }
    
  //   // If not found, use default
  //   console.log(`No position found for ID: ${productId}, using default`);
  //   return 'center center';
  // }

  getBackgroundPosition(productId: string): string {
    console.log(`Getting position for product ID: ${productId}`);
    
    // Check if we have a position for this product
    if (this.productPositions.has(productId)) {
      // Get the position index (1-12)
      const positionIndex: number = this.productPositions.get(productId) as number;
      console.log(`Found position index: ${positionIndex}`);
      
      // Convert to 0-based index for the array
      const arrayIndex: number = ((positionIndex - 1) % this.positionArray.length);
      
      // Get the CSS position
      const position = this.positionArray[arrayIndex];
      console.log(`Position ${positionIndex} maps to CSS: ${position}`);
      
      return position;
    }
    
    // If not found, use default
    console.log(`No position found for ID: ${productId}, using default`);
    return 'center center';
  }

  private savePositionsToStorage(): void {
    try {
      // Convert Map to array of entries for serialization
      const positionsArray = Array.from(this.productPositions.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(positionsArray));
      console.log('Saved product positions to localStorage');
    } catch (error) {
      console.error('Error saving positions to localStorage:', error);
    }
  }

private loadPositionsFromStorage(): void {
  try {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    
    if (storedData) {
      // Parse the stored data
      const positionsArray: Array<[string, number]> = JSON.parse(storedData);
      
      // Clear and rebuild the Map
      this.productPositions.clear();
      
      // Ensure each entry has the correct types
      positionsArray.forEach((entry) => {
        const id: string = entry[0];
        const position: number = entry[1];
        this.productPositions.set(id, position);
      });
      
      console.log('Loaded product positions from localStorage');
      this.logAllPositions();
    } else {
      console.log('No stored product positions found in localStorage');
    }
  } catch (error) {
    console.error('Error loading positions from localStorage:', error);
  }
}

logAllPositions(): void {
  console.log('Current product position mappings:');
  this.productPositions.forEach((posIndex, id) => {
    // Ensure posIndex is treated as a number
    const numericPosIndex: number = posIndex;
    const arrayIndex: number = ((numericPosIndex - 1) % this.positionArray.length);
    console.log(`  ID: ${id} -> Position: ${posIndex} -> CSS: ${this.positionArray[arrayIndex]}`);
  });
}

clearStoredPositions(): void {
  localStorage.removeItem(this.STORAGE_KEY);
  this.productPositions.clear();
  console.log('Cleared all stored product positions');
}
  
  /**
   * Debug method to show all stored positions
   */
  // logAllPositions(): void {
  //   console.log('Current product position mappings:');
  //   this.productPositions.forEach((posIndex, id) => {
  //     const numericPosIndex: any = posIndex;
  //     const arrayIndex: number = (numericPosIndex - 1) % this.positionArray.length;
  //     console.log(`  ID: ${id} -> Position: ${posIndex} -> CSS: ${this.positionArray[arrayIndex]}`);
  //   });
  // }


// getBackgroundPosition(productId: string): string {
//   console.log(`Looking up position for product ID: "${productId}"`);
//   console.log(`Map has ${this.productPositions.size} entries`);
  
//   // Check if the map contains this ID
//   const hasKey = this.productPositions.has(productId);
//   console.log(`Map contains this ID: ${hasKey}`);
  
//   // If we have a mapping for this product, return it
//   if (hasKey) {
//     const position = this.productPositions.get(productId);
//     console.log(`Found position: ${position}`);
//     return position || 'center center';
//   }
  
//   // Default position if not found
//   console.log(`No position mapping found for product ${productId}, using default`);
//   return 'center center';
// }

// getBackgroundPosition(productId: string): string {
//   console.log(`Getting position for product ID: ${productId}`);
  
//   // Check if we have a position for this product
//   if (this.productPositions.has(productId)) {
//     // Get the position index (1-12)
//     const positionIndex = this.productPositions.get(productId);
//     console.log(`Found position index: ${positionIndex}`);
    
//     // Convert to 0-based index for the array
//     const arrayIndex = (positionIndex! - 1) % this.positions.length;
    
//     // Get the CSS position
//     const position = this.positions[arrayIndex];
//     console.log(`Position ${positionIndex} maps to CSS: ${position}`);
    
//     return position;
//   }
  
//   // If not found, use default
//   console.log(`No position found for ID: ${productId}, using default`);
//   return 'center center';
// }

// logAllPositions(): void {
//   console.log('Current product position mappings:');
//   this.productPositions.forEach((posIndex, id) => {
//     const arrayIndex = (posIndex - 1) % this.positions.length;
//     console.log(`  ID: ${id} -> Position: ${posIndex} -> CSS: ${this.positions[arrayIndex]}`);
//   });
// }

// debugGetAllMappings(): void {
//   console.log('All stored product ID to position mappings:');
//   this.productPositions.forEach((position, id) => {
//     console.log(`  ${id}: ${position}`);
//   });
// }
}