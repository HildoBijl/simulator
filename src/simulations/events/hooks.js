import { useCollection } from 'fb'

// useSimulationEvents returns an object with all simulation events. It loads them from the database and includes their IDs in the objects.
export function useSimulationEvents(simulationId, once) {
	return useCollection(`simulations/${simulationId}/events`, once)
}
