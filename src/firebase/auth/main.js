import { getAuth, signOut as firebaseSignOut } from 'firebase/auth'

import { app } from '../main'

// Set up the auth object.
export const auth = getAuth(app)
auth.languageCode = 'de' // Default German on sign-in.

// Define a general sign-out function, regardless of method.
export const signOut = async () => firebaseSignOut(auth)
