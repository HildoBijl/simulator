import { useMemo } from 'react'

import { deleteDocument, useUser, useDocument } from 'fb'

// useUserInvites returns for the current user all simulationIds to which invites have been received.
export function useUserInvites(once) {
	// Check user status.
	const user = useUser()
	if (!user)
		throw new Error(`Invalid UserInvite request: cannot retrieve invites for a non-signed-in user.`)
	const { email } = user

	// If the invites is an empty array, remove the respective document from the database.
	const invites = useDocument('simulationInvitesPerUser', email, once)
	if (invites && invites.invites && invites.invites.length === 0)
		deleteDocument('simulationInvitesPerUser', email)

	// Process the retrieved data.
	return useMemo(() => {
		if (invites === undefined)
			return []
		if (invites)
			return invites.invites
		return null // Sign of an error.
	}, [invites])
}

// useSimulationInvites returns for the given simulationId the respective invites.
export function useSimulationInvites(simulationId, once) {
	// On missing or faulty data, don't do further processing.
	const invites = useDocument('simulationInvitesPerSimulation', simulationId, once)

	// If the invites is an empty array, remove the respective document from the database.
	if (invites && invites.invites && invites.invites.length === 0)
		deleteDocument('simulationInvitesPerSimulation', simulationId)

	// Process the retrieved data.
	return useMemo(() => {
		if (invites === undefined)
			return []
		if (invites)
			return invites.invites
		return null // Sign of an error.
	}, [invites])
}
