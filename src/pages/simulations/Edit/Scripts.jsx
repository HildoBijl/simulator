import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useSimulation } from 'simulations'
import { Page } from 'components'

import { hasVariables } from '../util'

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
	return <p>{simulation.title}</p>
}
