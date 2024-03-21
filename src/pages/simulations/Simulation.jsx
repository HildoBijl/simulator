import { Fragment, useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Button from '@mui/material/Button'

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
			<Button variant="contained" sx={{ margin: '1rem 0' }} onClick={() => window.alert('Die Simulationsfunktionen sind leider noch nicht implementiert worden.')}>Simulation beginnen</Button>
		</Page>
	)
}

function Description({ simulation: { description } }) {
	if (!description)
		return <p>Diese Simulation hat noch keine Beschreibung.</p>

	return description.split('\n\n').map((paragraph, index) => {
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
	const { type } = media
	switch (type) {
		case 'internalImage':
			return null // ToDo
		case 'externalImage':
			return <ExternalImage media={simulation.media} />
		case 'externalVideo':
			return null // ToDo
		default:
			throw new Error(`Invalid media type: encountered a type "${type}" but this is not among the available options.`)
	}
}

function ExternalImage({ media }) {
	// When the image loads or fails to load, update the validity setting.
	const [valid, setValid] = useState(false)
	const ref = useRef()
	useEffect(() => {
		let active = true
		if (ref.current) {
			ref.current.onerror = () => active && setValid(false)
			ref.current.onload = () => active && setValid(true)
		}
		return () => { active = false }
	})

	// Show the picture, but only if it's valid.
	return <img ref={ref} src={media.path} style={{ maxHeight: '480px', maxWidth: '100%', display: valid ? 'block' : 'none' }} />
}
