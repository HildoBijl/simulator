import { getDocumentRef, updateDocument, deleteDocument } from '../../firebase'

// getEventRef will create a reference to a potential new event.
export function getEventRef(simulationId) {
	return getDocumentRef(`simulations/${simulationId}/events`)
}

// updateEvent will update certain values for an Event with a given simulationId and eventId.
export async function updateEvent(simulationId, eventId, data) {
	return await updateDocument(`simulations/${simulationId}/events`, eventId, data)
}

// deleteEvent will remove a certain event from the database.
export async function deleteEvent(simulation, event) {
	return await deleteDocument(`simulations/${simulation.id}/events`, event.id)
}
