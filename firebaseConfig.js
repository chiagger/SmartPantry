// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxI6U--s4A9uQOXj0oC45ZczxA7AkkG70",
  authDomain: "smartpantry-it.firebaseapp.com",
  projectId: "smartpantry-it",
  storageBucket: "smartpantry-it.firebasestorage.app",
  messagingSenderId: "64338584040",
  appId: "1:64338584040:web:c9af956ecc350c3499845d",
  measurementId: "G-21Q8BGND41",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
