import Button from '@mui/material/Button'

import { Page, InputParagraph, Media } from '../../../../components'

export function StartPage({ simulation, start }) {
	return <Page title={simulation.title || '[Simulationstitel fehlt]'}>
		<InputParagraph fallback="[Diese Simulation hat noch keine Beschreibung.]">{simulation.description}</InputParagraph>
		<Media media={simulation.media} />
		{simulation.questions ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => start()}>Simulation anfangen</Button> : <p>Diese Simulation kann noch nicht gespielt werden: Es sind noch keine Fragen vorhanden.</p>}
	</Page>
}
