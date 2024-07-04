import { arrayRemove, deleteField } from 'firebase/firestore'

import { removeKeys } from 'util'
import { getDocumentRef, updateDocument, deleteDocument, deleteMediaFile } from 'fb'

import { updateSimulation } from '../functions'
import { updateEvent } from '../events'

// getQuestionRef will create a reference to a potential new question.
export function getQuestionRef(simulationId) {
	return getDocumentRef(`simulations/${simulationId}/questions`)
}

// updateQuestion will update certain values for a question with a given simulationId and questionId.
export async function updateQuestion(simulationId, questionId, data) {
	return await updateDocument(`simulations/${simulationId}/questions`, questionId, data)
}

// deleteQuestion will remove a certain question from the database.
export async function deleteQuestion(simulation, questionToRemove) {
	// Walk through the simulation questions to see if this question appears in any link, either as main follow-up question or as an option follow-up.
	await Promise.all(!simulation.questions ? [] : Object.values(simulation.questions).map(async question => {
		const update = {}
		if (question.followUpQuestion === questionToRemove.id)
			update.followUpQuestion = deleteField()
		if (question.options && question.options.some(option => option.followUpQuestion === questionToRemove.id))
			update.options = question.options.map(option => option.followUpQuestion === questionToRemove.id ? removeKeys(option, 'followUpQuestion') : option)
		if (Object.keys(update).length > 0)
			await updateQuestion(simulation.id, question.id, update)
	}))

	// Walk through the simulation events to see if this question appears in any event jump. If so, remove the question reference.
	await Promise.all(!simulation.events ? [] : Object.values(simulation.events).map(async event => {
		if (event.question === questionToRemove.id)
			await updateEvent(simulation.id, event.id, { question: deleteField() })
	}))

	// Update the main simulation object. If the starting question is the question to be removed, update the starting question too.
	const update = { questionOrder: arrayRemove(questionToRemove.id) }
	if (simulation.startingQuestion === questionToRemove.id) {
		if (simulation.questionOrder.length === 1)
			update.startingQuestion = deleteField() // Last question. Delete it.
		else
			update.startingQuestion = simulation.questionOrder.find(questionId => questionId !== questionToRemove.id) // Find the first question in the order that's not this question.
	}
	await updateSimulation(simulation.id, update)

	// Finally delete the question itself.
	await deleteMediaFile(questionToRemove.media)
	return await deleteDocument(`simulations/${simulation.id}/questions`, questionToRemove.id)
}
