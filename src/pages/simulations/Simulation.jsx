import { Fragment, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useSimulation, useSimulationIdFromUrl } from '../../simulations'

import { usePrevious } from '../../util'
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

	// Upon a change of the URL by the simulation creator, update the URL in the browser too.
	const url = simulation?.url
	const previousUrl = usePrevious(url)
	useEffect(() => {
		if (previousUrl) {
			console.log('Changed url from ' + previousUrl + ' to ' + url)
			window.history.pushState({}, undefined, `/s/${url}`)
		}
	}, [previousUrl, url])

	// On an error or loading, show the right content.
	if (simulation === null)
		return <Error />
	if (simulation === undefined)
		return <Page title="Simulation laden..." />

	// Render the simulation.
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
