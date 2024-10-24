import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from 'src/environments/environment';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Storage instance
export const storage = getStorage(app);