import { firebaseAuth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const yahooProvider = new OAuthProvider("yahoo.com");
yahooProvider.setCustomParameters({ prompt: "login" });

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(firebaseAuth, googleProvider);
}

export async function signInWithYahoo(): Promise<void> {
  await signInWithPopup(firebaseAuth, yahooProvider);
}
