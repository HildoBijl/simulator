import { Fragment, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Button from '@mui/material/Button'

import { useSimulation, useSimulationIdFromUrl } from '../../simulations'

import { usePrevious } from '../../util'
import { InternalImage, ExternalImage, YouTubeVideo, Page } from '../../components'

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
		if (previousUrl)
			window.history.pushState({}, undefined, `/s/${url}`)
	}, [previousUrl, url])

	// On an error or on loading, show the right notification.
	if (simulation === null)
		return <Error />
	if (simulation === undefined)
		return <Page title="Simulation laden..." />

	// Render the simulation.
	return (
		<Page title={simulation.title}>
			<Description simulation={simulation} />
			<Media simulation={simulation} />
			<Button variant="contained" sx={{ margin: '1rem 0' }} onClick={() => window.alert('Die Simulationsfunktionen sind leider noch nicht implementiert worden.')}>Simulation anfangen</Button>
		</Page>
	)
}

function Description({ simulation: { description } }) {
	if (!description)
		return <p>Diese Simulation hat noch keine Beschreibung.</p>

	return description.replace(/\n\n+/g, '\n\n').split('\n\n').map((paragraph, index) => {
		const paragraphSplit = paragraph.split('\n')
		return <p key={index}>
			{paragraphSplit.map((subParagraph, subIndex) => <Fragment key={subIndex}>{subParagraph}{subIndex < paragraphSplit.length - 1 ? <br /> : null}</Fragment>)}
		</p>
	})
}

function Media({ simulation }) {
	// On no media, do not display anything.
	const { media } = simulation
	if (!media)
		return null

	// Depending on the type of media, render the appropriate component.
	const height = 480
	const imageStyle = { maxHeight: `${height}px`, maxWidth: '100%', display: 'block' }
	const { type } = media
	switch (type) {
		case 'internalImage':
			return <InternalImage path={simulation.media.path} style={imageStyle} />
		case 'externalImage':
			return <ExternalImage path={simulation.media.path} style={imageStyle} />
		case 'youtubeVideo':
			return <YouTubeVideo id={simulation.media.id} height={height} />
		default:
			throw new Error(`Invalid media type: encountered a type "${type}" but this is not among the available options.`)
	}
}
