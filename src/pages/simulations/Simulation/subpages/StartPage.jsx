import Button from '@mui/material/Button'

import { Page, Media, MCEContents } from 'components'
import { useIsOwner } from 'simulations'

export function StartPage({ simulation, start }) {
	const isOwner = useIsOwner(simulation)
	return <Page title={simulation.title || '[Simulationstitel fehlt]'} showLogo="right">
		<MCEContents>{simulation.description || '<p>[Diese Simulation hat noch keine Beschreibung.]</p>'}</MCEContents>
		<Media media={simulation.media} />
		{simulation.questions ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => start(isOwner)}>Anfangen</Button> : <p>Diese Simulation kann noch nicht gespielt werden: Es sind noch keine Seiten vorhanden.</p>}
	</Page>
}
