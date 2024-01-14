import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAtLpdeEtT_i43bWI25IbEurHYEd6s7s_g",
    authDomain: "smartattend-6da73.firebaseapp.com",
    projectId: "smartattend-6da73",
    storageBucket: "smartattend-6da73.appspot.com",
    messagingSenderId: "426645082689",
    appId: "1:426645082689:web:9a9cb3303f1212306d6cc0",
    measurementId: "G-WS6V0YL1LS"
  };
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
