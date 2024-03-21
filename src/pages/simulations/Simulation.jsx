import { useParams } from 'react-router-dom'

import { useSimulation, useSimulationIdFromUrl } from '../../simulations'

import { Page } from '../../components'

import { Error } from '../Error'

export function Simulation() {
	const { simulationUrl } = useParams()
	const id = useSimulationIdFromUrl(simulationUrl)
	if (id === null)
		return <Error />
	if (id === undefined)
		return <Page title="Simulation laden..." />
	return <SimulationWithId id={id} />
}

export function SimulationWithId({ id }) {
	const simulation = useSimulation(id)
	if (simulation === null)
		return <Error />
	if (simulation === undefined)
		return <Page title="Simulation laden..." />

	return (
		<Page title={simulation.title}>
			<p>The simulation will be shown here.</p>
		</Page>
	)
}
