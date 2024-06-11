import Button from '@mui/material/Button'

import { Page } from 'components'
import { useIsOwner } from 'simulations'

import { getState } from '../../util'

import { VariableOverview } from '../components'

export function EndPage({ simulation, history, reset }) {
	const isOwner = useIsOwner(simulation)
	const state = getState(history)
	return <Page title="Ende der Simulation">
		<p>Sie haben die Simulation abgeschlossen!</p>
		<Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => reset(isOwner)}>Neu anfangen</Button>
		<VariableOverview {...{ simulation, state }} showHidden={true} />
	</Page>
}
