import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'

import { auth } from './main'

// Initialize Google Firebase Auth provider.
const provider = new GoogleAuthProvider()

// Set up the provider with the right settings.
// provider.setCustomParameters({   
//     prompt : "select_account"
// })

// Set up functions to sign in/out.
export const signInWithGooglePopup = () => signInWithPopup(auth, provider)
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, provider)
