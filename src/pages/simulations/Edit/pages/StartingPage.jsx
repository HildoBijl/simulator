import { deleteField } from 'firebase/firestore'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { FormPart } from 'components'
import { updateSimulation, pageIndexToString } from 'simulations'

import { emptyPage } from '../../util/settings'

export function StartingPage({ simulation }) {
	// Set up a handler to set the starting page.
	const setStartingPage = async (pageId) => {
		return await updateSimulation(simulation.id, { startingPage: pageId === 'none' ? deleteField() : pageId })
	}

	// Render the dropdown list.
	const startingPage = simulation.startingPage || simulation.pageList[0]?.id || 'none'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Startseite</InputLabel>
			<Select value={startingPage} label="Startseite" onChange={(event) => setStartingPage(event.target.value)}>
				{simulation.pageList.length > 0 ?
					simulation.pageList.map(page => <MenuItem key={page.id} value={page.id}>{`${pageIndexToString(page.index)}  ${page.internalTitle || page.title || emptyPage}`}</MenuItem>) :
					<MenuItem key="none" value="none">Es sind noch keine Seiten vorhanden.</MenuItem>}
			</Select>
		</FormControl>
	</FormPart>
}
