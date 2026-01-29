import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Tus credenciales de Wayra (SIN CAMBIOS)
const firebaseConfig = {
  apiKey: "AIzaSyBixQe8lK_yF_Jodg4aQbwBTmrtUibWBMA",
  authDomain: "wayra-a8c35.firebaseapp.com",
  projectId: "wayra-a8c35",
  storageBucket: "wayra-a8c35.firebasestorage.app",
  messagingSenderId: "439410864228",
  appId: "1:439410864228:web:15c9c728917aca84362f71",
  measurementId: "G-7CQZ12GZVV"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);


setPersistence(auth, browserLocalPersistence);


export const db = getFirestore(app);
