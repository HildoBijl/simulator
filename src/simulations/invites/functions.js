import { arrayUnion, arrayRemove } from 'firebase/firestore'

import { updateDocument } from 'fb'

import { addOwnerToSimulation, addSimulationToUserData } from '../functions'

// registerSimulationInvite will add a registration for a simulation to the database.
export async function registerSimulationInvite(simulationId, email) {
	await Promise.all([
		updateDocument('simulationInvitesPerSimulation', simulationId, { invites: arrayUnion(email) }, true),
		updateDocument('simulationInvitesPerUser', email, { invites: arrayUnion(simulationId) }, true)
	])
}

// deleteSimulationInvite will remove a specific invite for a simulationId/email combination.
export async function deleteSimulationInvite(simulationId, email) {
	await Promise.all([
		updateDocument('simulationInvitesPerSimulation', simulationId, { invites: arrayRemove(email) }, true),
		updateDocument('simulationInvitesPerUser', email, { invites: arrayRemove(simulationId) }, true)
	])
}

// acceptSimulationInvite will process the acceptance of an invite by the invitee.
export async function acceptSimulationInvite(simulationId, user) {
	// First add the user as an owner. (This requires the invite to be present.)
	await Promise.all([
		addOwnerToSimulation(user.uid, simulationId),
		addSimulationToUserData(user.uid, simulationId),
	])

	// Then remove the invite.
	await deleteSimulationInvite(simulationId, user.email)
}
