import { Fragment } from 'react'
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
			{simulation.description ?
				simulation.description.split('\n\n').map((paragraph, index) => {
					const paragraphSplit = paragraph.split('\n')
					return <p key={index}>
						{paragraphSplit.map((subParagraph, subIndex) => <Fragment key={subIndex}>{subParagraph}{subIndex < paragraphSplit.length - 1 ? <br /> : null}</Fragment>)}
					</p>
				}) :
				<p>Diese Simulation hat noch keine Beschreibung.</p>}
		</Page>
	)
}
