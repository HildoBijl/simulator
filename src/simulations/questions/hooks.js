import { useCollection } from 'fb'

// useSimulationQuestions returns an object with all simulation questions. It loads them from the database and includes their IDs in the objects.
export function useSimulationQuestions(simulationId, once) {
	return useCollection(`simulations/${simulationId}/questions`, once)
}
