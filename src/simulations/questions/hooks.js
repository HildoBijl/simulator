import { useCollection } from 'fb'

// useSimulationPages returns an object with all simulation pages. It loads them from the database and includes their IDs in the objects.
export function useSimulationPages(simulationId, once) {
	return useCollection(`simulations/${simulationId}/pages`, once)
}
