import { arrayRemove, deleteField } from 'firebase/firestore'

import { removeKeys, insertIntoArray, moveArrayElement } from 'util'
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
	// Walk through the simulation questions and folders and remove any references to this question.
	await Promise.all(!simulation.questions ? [] : Object.values(simulation.questions).map(async question => {
		const update = {}

		// On a folder, remove the question from its contents.
		if (question.type === 'folder') {
			if ((question.contents || []).includes(questionToRemove.id))
				update.contents = arrayRemove(questionToRemove.id)
		}

		// On a question, remove it when it appears as follow-up question for the question itself or for an option.
		if (question.type === 'question' || question.type === undefined) {
			if (question.followUpQuestion === questionToRemove.id)
				update.followUpQuestion = deleteField()
			if (question.options && question.options.some(option => option.followUpQuestion === questionToRemove.id))
				update.options = question.options.map(option => option.followUpQuestion === questionToRemove.id ? removeKeys(option, 'followUpQuestion') : option)
		}

		// Apply the update if needed.
		if (Object.keys(update).length > 0)
			await updateQuestion(simulation.id, question.id, update)
	}))

	// Walk through the simulation events to see if this question appears in any event jump. If so, remove the question reference.
	await Promise.all(!simulation.events ? [] : Object.values(simulation.events).map(async event => {
		if (event.question === questionToRemove.id)
			await updateEvent(simulation.id, event.id, { question: deleteField() })
	}))

	// Update the main simulation object.
	const update = {}
	if (simulation.questionOrder.includes(questionToRemove.id))
		update.questionOrder = arrayRemove(questionToRemove.id)
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

// moveQuestion will move a question for a given simulation from one folder to another.
export async function moveQuestion(simulation, questionToMove, originFolder, destinationFolder, index) {
	const questionOrder = simulation.questionOrder || []
	const originContents = (originFolder?.contents || []).map(question => question.id)
	const destinationContents = (destinationFolder?.contents || []).map(question => question.id)

	// If the origin and the destination folder are the same, adjust only that folder.
	if (!originFolder && !destinationFolder)
		return await updateSimulation(simulation.id, { questionOrder: moveArrayElement(questionOrder, questionOrder.indexOf(questionToMove.id), index) })
	if (originFolder?.id === destinationFolder?.id)
		return await updateQuestion(simulation.id, originFolder.id, { contents: moveArrayElement(originContents, originContents.indexOf(questionToMove.id), index) })

	// Set up a promise for the removing.
	const removingPromise = originFolder ?
		updateQuestion(simulation.id, originFolder.id, { contents: originContents.filter(questionId => questionId !== questionToMove.id) }) :
		updateSimulation(simulation.id, { questionOrder: questionOrder.filter(questionId => questionId !== questionToMove.id) })

	// Set up a promise for the adding.
	const addingPromise = destinationFolder ?
		updateQuestion(simulation.id, destinationFolder.id, { contents: insertIntoArray(destinationContents, index, questionToMove.id) }) :
		updateSimulation(simulation.id, { questionOrder: insertIntoArray(questionOrder, index, questionToMove.id) })

	// Await both promises together.
	return await Promise.all([removingPromise, addingPromise])
}

// moveOption will switch the order of the options within a question.
export async function moveOption(simulation, question, from, to) {
	if (from === to)
		return
	return updateQuestion(simulation.id, question.id, {
		options: moveArrayElement(question.options, from, to)
	})
}
