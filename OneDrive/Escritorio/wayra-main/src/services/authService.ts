import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { auth } from './firebaseConfig';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export const AuthService = {
 
  loginEmail: async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },


  register: async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  
  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },


  loginFacebook: async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

 
  logout: async () => {
    await signOut(auth);
  }
};