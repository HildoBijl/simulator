import { collection, doc, addDoc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

import { db } from './initialization'

// getDocumentRef returns a reference to a potentially new document.
export function getDocumentRef(path) {
	return doc(collection(db, path))
}

// addDocument adds a document to a given collection.
export async function addDocument(path, data) {
	return await addDoc(collection(db, path), data)
}

// getDocument reads a document from the database.
export async function getDocument(path, id) {
	return await getDoc(doc(db, path, id))
}

// updateDocument runs an update on a document with a given path and given ID.
export async function updateDocument(path, id, data, setOnNonExistent = false) {
	if (setOnNonExistent)
		return await setDoc(doc(db, path, id), data, { merge: true })
	return await updateDoc(doc(db, path, id), data)
}

// deleteDocument removes a document from the database.
export async function deleteDocument(path, id) {
	return await deleteDoc(doc(db, path, id))
}

// getDocuments takes a snapshot of a set of documents and turns it into a basic object with the documents. By default it also adds the document ID to the objects for easier reference, but this can be turned off.
export function getDocuments(snapshot, includeId = true) {
	const documents = {}
	snapshot.docs.forEach(doc => {
		documents[doc.id] = includeId ? { id: doc.id, ...doc.data() } : doc.data()
	})
	return documents
}
