import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'

import { getBaseUrl, useTrackedState } from 'util'
import { FormPart, TrackedTextField } from 'components'
import { getSimulationByUrl, updateSimulation } from 'simulations'

export function MainSettings({ simulation }) {
	return <>
		<ChangeUrl simulation={simulation} />
		<FormPart>
			<TrackedTextField label="Titel (z.B. Meine erste Simulation)" value={simulation.title} path="simulations" documentId={simulation.id} field="title" />
		</FormPart>
		{simulation.questionList.length === 0 ? <Alert severity="info" sx={{ my: 2 }}>Tipp: Öffnen Sie Ihre Simulation als &quot;Benutzer&quot; in einem zweiten Browser-Tab über den obigen Link. Um Ihre Simulation zu erstellen, fügen Sie dann über &quot;Seiten&quot; (oben) Seiten hinzu. Sie können Ihre Änderungen live verfolgen.</Alert> : null}
	</>
}

function ChangeUrl({ simulation }) {
	// Set up a handler that, upon a change, filters out unwanted symbols, checks for duplicates, and if all is in order saves the URL. Use a state, since the state here may differ from the database state, which must always be valid.
	const simulationUrl = simulation?.url || ''
	const [url, setUrl] = useTrackedState(simulationUrl)
	const [conflict, setConflict] = useState()
	const minUrlCharacters = 2
	const setAndSaveUrl = async (url) => {
		url = url.toLowerCase().replace(/[^a-z0-9_-]/g, '')
		setUrl(url)
		if (url.length >= minUrlCharacters) {
			const existingSimulation = await getSimulationByUrl(url)
			if (existingSimulation && existingSimulation.id !== simulation.id) {
				setConflict(existingSimulation)
			} else {
				setConflict(undefined)
				await updateSimulation(simulation.id, { url })
			}
		}
	}

	// Render the URL form part.
	const theme = useTheme()
	const fullUrl = `${getBaseUrl()}/s/${url}`
	return <FormPart>
		<TextField variant="outlined" fullWidth label="Simulation URL (z.B. meine-erste-simulation)" value={url} onChange={(event) => setAndSaveUrl(event.target.value)} />
		{url.length < minUrlCharacters ? null :
			conflict ?
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Eine Simulation mit der URL &quot;{url}&quot; existiert bereits. Versuchen Sie eine andere URL.</p> :
				<p>Die Simulation kann über <Link to={fullUrl} target="_blank" rel="noopener noreferrer">{fullUrl}</Link> aufgerufen werden.</p>}
	</FormPart>
}
