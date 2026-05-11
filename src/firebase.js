import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCwl584pjOiAjhRNoU3SSFYePN5lhlg2jQ",
  authDomain: "artelocal-60ad1.firebaseapp.com",
  projectId: "artelocal-60ad1",
  storageBucket: "artelocal-60ad1.firebasestorage.app",
  messagingSenderId: "924709481898",
  appId: "1:924709481898:web:a12a34259f3a63a8bc4fd3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
