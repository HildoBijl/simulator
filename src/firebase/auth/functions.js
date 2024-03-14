import { doc, getDoc } from 'firebase/firestore'

import { db } from '../db'

// getUserData takes a userId and returns the userData for that user.
export async function getUserData(userId) {
	const userDoc = await getDoc(doc(db, 'userData', userId))
	return userDoc.exists() ? userDoc.data() : {}
}
