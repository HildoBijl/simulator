import { getDocumentRef, updateDocument, deleteDocument } from '../../firebase'

// getQuestionRef will create a reference to a potential new question.
export function getQuestionRef(simulationId) {
	return getDocumentRef(`simulations/${simulationId}/questions`)
}

// updateQuestion will update certain values for a question with a given simulationId and questionId.
export async function updateQuestion(simulationId, questionId, data) {
	return await updateDocument(`simulations/${simulationId}/questions`, questionId, data)
}

// deleteQuestion will remove a certain question from the database.
export async function deleteQuestion(simulationId, questionId) {
	return await deleteDocument(`simulations/${simulationId}/questions`, questionId)
}