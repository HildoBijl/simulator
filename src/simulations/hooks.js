import { useMemo, useState, useEffect } from 'react'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { db, useUserData, useUserId } from 'fb'

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
	// Load in all required data.
	const useDocumentDataLoader = once ? useDocumentDataOnce : useDocumentData
	const [simulation, simulationLoading] = useDocumentDataLoader(doc(db, 'simulations', id))

	// Assemble the data, depending on the loading status.
	return useMemo(() => {
		if (simulationLoading)
			return undefined // Sign of loading.
		if (simulation)
			return { id, ...simulation }
		return null // Sign of an error.
	}, [id, simulationLoading, simulation])
}

// useSimulation gets a simulation with a specific ID.
export function useSimulation(id, once = false) {
	// Load in all required data.
	const simulation = useSimulationObject(id, once)
	const questions = useSimulationQuestions(id, once)
	const variables = useSimulationVariables(id, once)
	const events = useSimulationEvents(id, once)

	// Assemble the data, depending on the loading status.
	return useMemo(() => {
		if (simulation === undefined || questions === undefined || variables === undefined)
			return undefined // Sign of loading.
		if (simulation && questions && variables)
			return {
				...simulation,
				questions,
				questionList: (simulation.questionOrder || []).map(questionId => questions[questionId]),
				variables,
				events,
			}
		return null // Sign of an error.
	}, [simulation, questions, variables, events])
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
