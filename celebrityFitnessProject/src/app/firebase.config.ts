// import { initializeApp } from 'firebase/app';
// import { getStorage } from 'firebase/storage';
// import { getAuth } from 'firebase/auth';
// import { firebaseConfig } from 'src/environments/environment';
// import { environment } from 'src/environments/environment';

// // Initialize Firebase
// const app = initializeApp(environment.firebase);

// // Get Storage instance
// export const storage = getStorage(app);
// export const auth = getAuth(app);

// src/firebase.config.ts
// src/firebase.config.ts
// import { initializeApp, getApps, getApp} from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getStorage } from 'firebase/storage';
// import { environment } from '../environments/environment';

// let app;
// if (!getApps().length) {
//   app = initializeApp(environment.firebase);
//   console.log('Firebase initialized successfully');
// } else {
//   app = getApp();
//   console.log('Using existing Firebase app instance');
// }

// export const auth = getAuth(app);
// export const storage = getStorage(app);

// export default app;

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { environment } from '../environments/environment';

// Initialize Firebase app
const app = !getApps().length 
  ? initializeApp(environment.firebase)
  : getApp();

// Initialize services
const auth = getAuth(app);
const storage = getStorage(app);

// Only connect to emulators if explicitly enabled in environment
if (environment.useEmulators) {
  try {
    const { connectAuthEmulator } = require('firebase/auth');
    const { connectStorageEmulator } = require('firebase/storage');
    
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectStorageEmulator(storage, 'localhost', 9199);
    
    console.log('Firebase emulators connected successfully');
  } catch (error) {
    console.warn('Firebase emulators not available:', error);
  }
}

console.log('Firebase initialized successfully');

export { auth, storage };
export default app;