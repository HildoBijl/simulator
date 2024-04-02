import Button from '@mui/material/Button'

import { Page } from '../../../components'

export function EndPage({ reset }) {
	return <Page title="Ende der Simulation">
		<p>Sie haben die Simulation abgeschlossen!</p>
		<Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => reset()}>Neu anfangen</Button>
	</Page>
}
