// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getAuth } from "firebase/auth";

// export const firebaseConfig = {
//   apiKey: "AIzaSyBdQFzjf-d4P0Sm8pmKKh0HwdmG0BFW0qY",
//   authDomain: "hugh-jackedman-e13ce.firebaseapp.com",
//   projectId: "hugh-jackedman-e13ce",
//   storageBucket: "hugh-jackedman-e13ce.appspot.com",
//   messagingSenderId: "858773026238",
//   appId: "1:858773026238:web:cefe415bd4d92bba7ab5ef"
// };

// export const environment = {
//   production: true,
//   firebase: firebaseConfig
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// export const auth = getAuth(app);

// environment.ts
export const firebaseConfig = {
  apiKey: "AIzaSyBdQFzjf-d4P0Sm8pmKKh0HwdmG0BFW0qY",
  authDomain: "hugh-jackedman-e13ce.firebaseapp.com",
  projectId: "hugh-jackedman-e13ce",
  storageBucket: "hugh-jackedman-e13ce.appspot.com",
  messagingSenderId: "858773026238",
  appId: "1:858773026238:web:cefe415bd4d92bba7ab5ef",
  measurementId: "G-E4T4QNLNCZ"
};

export const environment = {
  production: false,
  firebase: firebaseConfig,
  useEmulators: false
};