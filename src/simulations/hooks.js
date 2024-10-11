import { useMemo, useState, useEffect } from 'react'

import { arrayToObject } from 'util'
import { useUserData, useUserId, useDocument } from 'fb'

import { getSimulationByUrl } from './functions'
import { useSimulationQuestions } from './questions'
import { useSimulationVariables } from './variables'
import { useSimulationEvents } from './events'

// useSimulationIds gets all the simulation IDs for a specific user.
export function useSimulationIds() {
	const userData = useUserData()
	if (!userData)
		return undefined
	return userData.simulations || []
}

// useSimulationObject returns the raw simulation object from the database. It is not merged yet with other parameters, like the questions.
export function useSimulationObject(id, once = false) {
	return useDocument('simulations', id, once)
}

// useSimulation gets a simulation with a specific ID.
export function useSimulation(id, once = false) {
	// Load in all required data.
	const simulation = useSimulationObject(id, once)
	const rawQuestions = useSimulationQuestions(id, once)
	const variables = useSimulationVariables(id, once)
	const events = useSimulationEvents(id, once)

	// Assemble the data, depending on the loading status.
	return useMemo(() => {
		if (simulation === undefined || rawQuestions === undefined || variables === undefined)
			return undefined // Sign of loading.
		if (simulation && rawQuestions && variables) {
			const { questions, questionTree, questionList } = processQuestions(simulation.questionOrder, rawQuestions)
			return {
				...simulation,
				questions, questionTree, questionList,
				variables,
				events,
			}
		}
		return null // Sign of an error.
	}, [simulation, rawQuestions, variables, events])
}

// useSimulationIdFromUrl takes a simulation URL and returns an ID from it.
export function useSimulationIdFromUrl(url) {
	const [id, setId] = useState(url ? undefined : null)

	// Get the simulation ID from the database based on the URL.
	useEffect(() => {
		let active = true // To prevent state changes after dismount.
		if (url) {
			getSimulationByUrl(url).then(simulation => {
				if (active)
					setId(simulation?.id || null)
			})
		}
		return () => { active = false }
	}, [url])

	return id
}

// useIsOwner takes a simulation and checks if the given user is an owner.
export function useIsOwner(simulation) {
	const userId = useUserId()
	return simulation?.owners && simulation.owners.includes(userId)
}

// processQuestions gets the raw questions out of the database and adds useful utility info. It receives an array of questionIds to process, as well as a dictionary of raw questions.
function processQuestions(questionOrder = [], rawQuestions = {}, indices = []) {
	// Process all questions in the questionOrder to get a questionTree.
	const questionTree = questionOrder.map((questionId, index) => processQuestion(rawQuestions[questionId], rawQuestions, [...indices, index]))

	// Flatten the tree. For now also include folders.
	const toArray = question => question.type === 'folder' ? [question, ...question.contents.map(question => toArray(question))] : question
	const questionListFull = questionTree.map(question => toArray(question)).flat(Infinity)
	const questions = arrayToObject(questionListFull, question => ({ key: question.id, value: question }))
	const questionList = questionListFull.filter(question => question.type === 'question' || question.type === undefined) // Only keep actual questions.
	return { questionTree, questionList, questions }
}

// processQuestion takes a single (raw) question, possibly a folder with contents, and a list of (raw) questions. It processes the question, turning links to contents into actual links.
function processQuestion(question, questions, indices) {
	// On a folder, recursively process subquestions.
	if (question.type === 'folder') {
		return {
			...question,
			index: indices,
			contents: (question.contents || []).map((questionId, index) => processQuestion(questions[questionId], questions, [...indices, index])),
		}
	}

	// On a question (default case) run basic processing.
	if (question.type === 'question' || question.type === undefined)
		return { ...question, index: indices }

	// Check for impossible cases.
	throw new Error(`Invalid question type: received a question of type "${question.type}" but this type is not known.`)
}
