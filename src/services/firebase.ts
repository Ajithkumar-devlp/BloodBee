import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "bloodbee-ajith-7",
  appId: "1:36851051747:web:53c19222bf4d46cc94e9d6",
  storageBucket: "bloodbee-ajith-7.firebasestorage.app",
  apiKey: "AIzaSyC_EEVeVwwjOxHCUxTVt5q8GhBGvxhSvtA",
  authDomain: "bloodbee-ajith-7.firebaseapp.com",
  messagingSenderId: "36851051747"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
