import { getDocumentRef, updateDocument, deleteDocument } from '../../firebase'

// getVariableRef will create a reference to a potential new variable.
export function getVariableRef(simulationId) {
	return getDocumentRef(`simulations/${simulationId}/variables`)
}

// updateVariable will update certain values for a Variable with a given simulationId and variableId.
export async function updateVariable(simulationId, variableId, data) {
	return await updateDocument(`simulations/${simulationId}/variables`, variableId, data)
}

// deleteVariable will remove a certain variable from the database.
export async function deleteVariable(simulation, variable) {
	return await deleteDocument(`simulations/${simulation.id}/variables`, variable.id)
}

// duplicateVariable will copy a certain variable.
export async function duplicateVariable(simulation, variable) {

}
