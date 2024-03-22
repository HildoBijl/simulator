import { collection, doc, query, where, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'

import { db, storage, getUserData } from '../firebase'

// getUserSimulationIds takes a userId and returns all simultion IDs for that user.
export async function getUserSimulationIds(userId) {
	const userData = await getUserData(userId)
	return userData?.simulations
}

// getSimulation takes a simulationId and retrieves the given simulation object.
export async function getSimulation(simulationId) {
	const simulationDoc = await getDoc(doc(db, 'simulations', simulationId))
	return simulationDoc.exists() ? simulationDoc.data() : undefined
}

// getSimulationByUrl takes a URL and retrieves the given simulation object, or undefined when it does not exist.
export async function getSimulationByUrl(url) {
	const snapshot = await getDocs(query(collection(db, 'simulations'), where('url', '==', url)))
	const simulationDocs = []
	snapshot.forEach(doc => simulationDocs.push({ id: doc.id, ...doc.data() }))
	if (simulationDocs.length > 1)
		throw new Error(`Invalid simulation URL: there are ${simulationDocs.length} simulations with the URL "${url}".`)
	return simulationDocs[0]
}

// createNewSimulation creates a new simulation with as owner the user with the given ID. It returns the ID of the new simulation.
export async function createNewSimulation(userId) {
	// Check the input.
	if (!userId)
		throw new Error(`Invalid game creation: could not create a game since no user is signed in.`)

	// Set up a new simulation.
	const simulationDocument = await addDoc(collection(db, 'simulations'), { owners: [userId] })
	const simulationId = simulationDocument.id

	// Make sure that the userData is also updated with this new simulation.
	await addSimulationToUserData(userId, simulationId)
	return simulationId
}

// addSimulationToUserData will add a simulation ID to the simulations that a user owns. It changes the userData, but not the simulation.
export async function addSimulationToUserData(userId, simulationId) {
	await setDoc(doc(db, 'userData', userId), { simulations: arrayUnion(simulationId) }, { merge: true })
}

// removeSimulationFromUserData removes a simulation ID from the simulations that a user owns. It changes the userData, but not the simulation.
export async function removeSimulationFromUserData(userId, simulationId) {
	return await updateDoc(doc(db, 'userData', userId), { simulations: arrayRemove(simulationId) })
}

// removeOwnerFromSimulation removes an owner from a simulation. It does not change the userData object. If the owner is the last owner, the simulation is removed.
export async function removeOwnerFromSimulation(userId, simulationId) {
	// Load simulation data and check the owner.
	const simulation = await getSimulation(simulationId)
	if (!simulation)
		throw new Error(`Invalid removeOwner call: cannot find simulation "${simulationId}".`)
	if (!simulation.owners.includes(userId))
		throw new Error(`Invalid removeOwner call: cannot remove user "${userId}" from simulation "${simulationId}" since this user is not an owner of this simulation.`)

	// Upon multiple owners, remove the owner from the simulation.
	if (simulation.owners.length > 1)
		return await updateDoc(doc(db, 'simulations', simulationId), { owners: arrayRemove(userId) })

	// When this is the last owner, remove the simulation.
	await deleteMediaFile(simulation?.media)
	await deleteDoc(doc(db, 'simulations', simulationId))
}

// removeUserFromAllSimulations removes a user as owner from all the simulation he/she is the owner of.
export async function removeUserFromAllSimulations(userId) {
	const simulationIds = await getUserSimulationIds(userId)
	return await Promise.all(simulationIds.map(simulationId => removeOwnerFromSimulation(userId, simulationId)))
}

// unlinkUserFromSimulation will remove both the user from a simulation and remove the simulation from the userData.
export async function unlinkUserFromSimulation(userId, simulationId) {
	await Promise.all([removeOwnerFromSimulation(userId, simulationId), removeSimulationFromUserData(userId, simulationId)])
}

// updateSimulation will update certain values for a simulation with a given ID.
export async function updateSimulation(simulationId, data) {
	return updateDoc(doc(db, 'simulations', simulationId), data)
}

// deleteMedia takes a simulation media parameter and deletes the corresponding internal media file if it exists. It requires the simulation to already be downloaded.
export async function deleteMediaFile(media) {
	if (media?.type === 'internalImage') {
		const imageRef = ref(storage, media.path)
		await deleteObject(imageRef)
	}
}
