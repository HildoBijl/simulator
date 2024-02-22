import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC4-GR7Vd0r3DWiIu4Vkko7iMTg32t37oc",
  authDomain: "simulator-54576.firebaseapp.com",
  projectId: "simulator-54576",
  storageBucket: "simulator-54576.appspot.com",
  messagingSenderId: "380108420737",
  appId: "1:380108420737:web:9989d3eaaa910ebbb13f80"
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
