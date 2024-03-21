import { Fragment, useState, useEffect, useRef } from 'react'
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
	const [valid, setValid] = useState(false)
	const ref = useRef()

	// On no image, do not display anything.
	if (!simulation.image)
		return null

	// When the image loads or fails to load, update the validity setting.
	if (ref.current) {
		ref.current.onerror = () => setValid(false)
		ref.current.onload = () => setValid(true)
	}

	// Show the picture, but only if it's valid.
	return <img ref={ref} src={simulation.image} style={{ maxHeight: '480px', maxWidth: '100%', display: valid ? 'block' : 'none' }} />
}
