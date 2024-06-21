import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { numberToLetter, useClearTags } from 'util'
import { useSimulation } from 'simulations'
import { Page } from 'components'

import { hasVariables } from '../util'
import { emptyQuestion, emptyOption } from '../settings'

import { QuestionUpdateScript, OptionUpdateScript } from './questions'
import { GeneralUpdateScript } from './variables'

const ScriptsPage = ({ children, simulationId }) => <Page title="Simulation Skript Übersicht" backButton={`/create/${simulationId}`}>{children}</Page>

export function Scripts() {
	const navigate = useNavigate()
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)

	// When the simulation is missing, go back to the create page.
	useEffect(() => {
		if (simulation === null)
			navigate('/create')
	}, [simulation, navigate])

	// If the simulation has no variables, go back to the simulation page.
	useEffect(() => {
		if (simulation && !hasVariables(simulation))
			navigate(`/create/${simulation.id}`)
	}, [simulation, navigate])

	// On missing data, we're probably still loading the simulation.
	if (!simulation)
		return <ScriptsPage {...{ simulationId }}><p>Simulation laden...</p></ScriptsPage>

	// Show the simulation form itself.
	return <ScriptsPage {...{ simulationId }}>
		<ScriptsForSimulation simulation={simulation} />
	</ScriptsPage>
}

function ScriptsForSimulation({ simulation }) {
	return <>
		{simulation.updateScript ? <GeneralUpdateScript {...{ simulation }} /> : null}
		{simulation.questionOrder.map((questionId, index) => <ScriptsForQuestion key={questionId} simulation={simulation} question={simulation.questions[questionId]} index={index} />)}
	</>
}

function ScriptsForQuestion({ simulation, question, index }) {
	// If the question has no update scripts, don't show it.
	if (!question.updateScript && (!question.options || !question.options.some(option => option.updateScript)))
		return null

	// Render the update scripts for this question.
	return <>
		<h4>Frage {index + 1}. {question.internalTitle || question.title || emptyQuestion}</h4>
		{question.updateScript ? <QuestionUpdateScript {...{ simulation, question }} /> : null}
		{question.options.map((option, optionIndex) => option.updateScript ? <OptionUpdateScriptWithLabel key={optionIndex} {...{ simulation, question, optionIndex }} /> : null)}
	</>
}

function OptionUpdateScriptWithLabel({ simulation, question, optionIndex }) {
	const option = question.options[optionIndex]
	const description = option.description || emptyOption
	const title = useClearTags(description.split('\n')[0] || emptyOption)
	const label = `${numberToLetter(optionIndex).toUpperCase()}. ${title}`
	return <OptionUpdateScript {...{ simulation, question, optionIndex, label }} />
}
