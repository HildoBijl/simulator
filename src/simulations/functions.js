import { collection, query, where, getDocs, arrayUnion, arrayRemove, increment } from 'firebase/firestore'

import { db, getUserData, addDocument, getDocument, getCollection, updateDocument, deleteDocument, deleteMediaFile } from 'fb'

// getUserSimulationIds takes a userId and returns all simultion IDs for that user.
export async function getUserSimulationIds(userId) {
	const userData = await getUserData(userId)
	return userData?.simulations
}

// getSimulation takes a simulationId and retrieves the given (raw) simulation object.
export async function getSimulation(simulationId) {
	const simulationDoc = await getDocument('simulations', simulationId)
	return simulationDoc && simulationDoc.exists() ? simulationDoc.data() : undefined
}

// getQuestions gets all the questions for a simulation with a given simulationId.
export async function getQuestions(simulationId) {
	return await getCollection(`simulations/${simulationId}/questions`)
}

// getSimulationByUrl takes a URL and retrieves the given (raw) simulation object, or undefined when it does not exist.
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
	const simulationDocument = await addDocument('simulations', { owners: [userId] })
	const simulationId = simulationDocument.id

	// Make sure that the userData is also updated with this new simulation.
	await addSimulationToUserData(userId, simulationId)
	return simulationId
}

// addSimulationToUserData will add a simulation ID to the simulations that a user owns. It changes the userData, but not the simulation.
export async function addSimulationToUserData(userId, simulationId) {
	await updateDocument('userData', userId, { simulations: arrayUnion(simulationId) }, true)
}

// addOwnerToSimulation will add a given userId as owner to the simulation.
export async function addOwnerToSimulation(userId, simulationId) {
	await updateSimulation(simulationId, { owners: arrayUnion(userId) })
}

// removeSimulationFromUserData removes a simulation ID from the simulations that a user owns. It changes the userData, but not the simulation.
export async function removeSimulationFromUserData(userId, simulationId) {
	return await updateDocument('userData', userId, { simulations: arrayRemove(simulationId) })
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
		return await updateDocument('simulations', simulationId, { owners: arrayRemove(userId) })

	// When this is the last owner, remove the simulation.
	const questions = await getQuestions(simulationId)
	await deleteMediaFile(simulation?.media) // Remove the main media file of the simulation.
	await Promise.all(Object.values(questions).map(question => deleteMediaFile(question?.media))) // Remove all media files of the questions.
	await deleteDocument('simulationInvitesPerSimulation', simulationId) // Remove the simulation invites document.
	await deleteDocument('simulations', simulationId) // Remove the simulation document.
}

// removeUserFromAllSimulations removes a user as owner from all the simulation he/she is the owner of.
export async function removeUserFromAllSimulations(userId) {
	const simulationIds = await getUserSimulationIds(userId)
	return await Promise.all(simulationIds.map(simulationId => removeOwnerFromSimulation(userId, simulationId)))
}

// unlinkUserFromSimulation will remove both the user from a simulation and remove the simulation from the userData.
export async function unlinkUserFromSimulation(userId, simulationId) {
	return await Promise.all([removeOwnerFromSimulation(userId, simulationId), removeSimulationFromUserData(userId, simulationId)])
}

// updateSimulation will update certain values for a simulation with a given ID.
export async function updateSimulation(simulationId, data) {
	return updateDocument('simulations', simulationId, data)
}

// incrementField increases the given field for a simulation.
export async function incrementSimulationField(simulationId, field) {
	return updateSimulation(simulationId, { [field]: increment(1) })
}
