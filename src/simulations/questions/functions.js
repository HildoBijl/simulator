import { arrayRemove, deleteField } from 'firebase/firestore'

import { getDocumentRef, updateDocument, deleteDocument, deleteMediaFile } from '../../firebase'

import { updateSimulation } from '../functions'

// getQuestionRef will create a reference to a potential new question.
export function getQuestionRef(simulationId) {
	return getDocumentRef(`simulations/${simulationId}/questions`)
}

// updateQuestion will update certain values for a question with a given simulationId and questionId.
export async function updateQuestion(simulationId, questionId, data) {
	return await updateDocument(`simulations/${simulationId}/questions`, questionId, data)
}

// deleteQuestion will remove a certain question from the database.
export async function deleteQuestion(simulation, question) {
	// First update the simulation. If the starting question is the question to be removed, update the starting question too.
	const update = { questionOrder: arrayRemove(question.id) }
	if (simulation.startingQuestion === question.id) {
		if (simulation.questionOrder.length === 1)
			update.startingQuestion = deleteField() // Last question. Delete it.
		else
			update.startingQuestion = simulation.questionOrder.find(currQuestionId => currQuestionId !== question.id) // Find the first question in the order that's not this question.
	}
	await updateSimulation(simulation.id, update)

	// Then apply remaining updates.
	await deleteMediaFile(question.media)
	return await deleteDocument(`simulations/${simulation.id}/questions`, question.id)
}
