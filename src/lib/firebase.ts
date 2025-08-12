import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// IMPORTANT: Replace with your Firebase project's configuration
const firebaseConfig = {
  projectId: "varzeachampions",
  appId: "1:737579860217:web:16bc7e600c7b571a446228",
  storageBucket: "varzeachampions.appspot.com",
  apiKey: "AIzaSyC4LO3fxf2b0br5qzrdfeKhliYEO97qdGk",
  authDomain: "varzeachampions.firebaseapp.com",
  messagingSenderId: "737579860217"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
