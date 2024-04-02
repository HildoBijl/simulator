import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious } from '../../../util'
import { Page } from '../../../components'
import { useSimulation, useSimulationIdFromUrl } from '../../../simulations'

import { Error } from '../../Error'

import { StartPage } from './StartPage'
import { EndPage } from './EndPage'
import { Question } from './Question'

export function Simulation() {
	const { simulationUrl } = useParams()
	const id = useSimulationIdFromUrl(simulationUrl)
	if (id === null)
		return <Error />
	if (id === undefined)
		return <Page title="Simulation laden..." />
	return <SimulationWithId id={id} />
}

function SimulationWithId({ id }) {
	const simulation = useSimulation(id)

	// Upon a change of the URL by the simulation creator, update the URL in the browser too.
	const url = simulation?.url
	const previousUrl = usePrevious(url)
	useEffect(() => {
		if (previousUrl)
			window.history.pushState({}, undefined, `/s/${url}`)
	}, [previousUrl, url])

	// On an error or on loading, show the right notification.
	if (simulation === null)
		return <Error />
	if (simulation === undefined)
		return <Page title="Simulation laden..." />

	// We have a valid simulation! Render it! Add a key to assure a reload on a change of simulation.
	return <SimulationWithData key={simulation.id} simulation={simulation} />
}

function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [questionId, setQuestionId] = useState()
	const [questionCounter, setQuestionCounter] = useState(0)

	// Define handlers.
	const goToQuestion = (questionId) => {
		setQuestionId(questionId)
		setQuestionCounter(counter => counter + 1)
	}
	const resetSimulation = () => {
		setQuestionId(undefined)
		setQuestionCounter(0)
	}
	const startSimulation = () => {
		setQuestionId(simulation.startingQuestion || simulation.questions[0])
		setQuestionCounter(0)
	}

	// When there's no question yet, we're on the start page.
	if (!questionId)
		return <StartPage simulation={simulation} start={startSimulation} />
	if (questionId === 'end')
		return <EndPage simulation={simulation} reset={resetSimulation} />
	return <Question key={questionCounter} simulation={simulation} question={simulation.questions[questionId]} goToQuestion={goToQuestion} />
}
