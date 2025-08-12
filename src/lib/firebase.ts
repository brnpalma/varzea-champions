import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// IMPORTANT: Replace with your Firebase project's configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7LcRr6Rc9UR5J42VgSVvYPfKhMPx3VSs",
  authDomain: "varzea-champions-manager.firebaseapp.com",
  projectId: "varzea-champions-manager",
  storageBucket: "varzea-champions-manager.firebasestorage.app",
  messagingSenderId: "842794376801",
  appId: "1:842794376801:web:89f4c9f93afc892b385420",
  measurementId: "G-VJ9NYC343G"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
