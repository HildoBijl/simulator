import { useMemo } from 'react'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { db, useUser } from 'fb'

// useUserInvites returns for the current user all simulationIds to which invites have been received.
export function useUserInvites(once = false) {
	// Check user status.
	const user = useUser()
	if (!user)
		throw new Error(`Invalid UserInvite request: cannot retrieve invites for a non-signed-in user.`)
	const { email } = user

	// Load in all required data.
	const useDocumentDataLoader = once ? useDocumentDataOnce : useDocumentData
	const [invites, invitesLoading] = useDocumentDataLoader(doc(db, 'simulationInvitesPerUser', email))

	// Assemble the data, depending on the loading status.
	return useMemo(() => {
		if (invitesLoading)
			return undefined // Sign of loading.
		if (invites)
			return invites?.invites || []
		return null // Sign of an error.
	}, [invitesLoading, invites])
}
