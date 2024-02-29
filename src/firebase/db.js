import { getFirestore } from 'firebase/firestore'

import { app } from './main'

export const db = getFirestore(app)
