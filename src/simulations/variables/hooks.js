import { useCollection } from 'fb'

// useSimulationVariables returns an object with all simulation variables. It loads them from the database and includes their IDs in the objects.
export function useSimulationVariables(simulationId, once) {
	return useCollection(`simulations/${simulationId}/variables`, once)
}
