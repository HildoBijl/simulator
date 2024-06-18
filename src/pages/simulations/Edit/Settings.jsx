import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { getBaseUrl, useTrackedState } from 'util'
import { useUserId } from 'fb'
import { FormPart, TrackedTextField, MediaUploader, MCE } from 'components'
import { unlinkUserFromSimulation, getSimulationByUrl, updateSimulation } from 'simulations'

export function Settings({ simulation }) {
	return <>
		<ChangeUrl simulation={simulation} />
		<FormPart>
			<TrackedTextField label="Titel" value={simulation.title} path="simulations" documentId={simulation.id} field="title" />
		</FormPart>
		<FormPart>
			<MCE label="Beschreibung" height="300" value={simulation.description} path="simulations" documentId={simulation.id} field="description" />
		</FormPart>
		<MediaUploader label="Abbildung" value={simulation.media} path="simulations" documentId={simulation.id} fileName="StartImage" />
		<RemoveSimulation simulation={simulation} />
	</>
}

function ChangeUrl({ simulation }) {
	// Set up a handler that, upon a change, filters out unwanted symbols, checks for duplicates, and if all is in order saves the URL. Use a state, since the state here may differ from the database state, which must always be valid.
	const simulationUrl = simulation?.url || ''
	const [url, setUrl] = useTrackedState(simulationUrl)
	const [conflict, setConflict] = useState()
	const minUrlCharacters = 2
	const setAndSaveUrl = async (url) => {
		url = url.toLowerCase().replace(/[^a-z0-9_-]/, '')
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
		<TextField variant="outlined" fullWidth label="Simulation URL" value={url} onChange={(event) => setAndSaveUrl(event.target.value)} />
		{url.length < minUrlCharacters ? null :
			conflict ?
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Eine Simulation mit der URL &quot;{url}&quot; existiert bereits. Versuchen Sie eine andere URL.</p> :
				<p>Die Simulation kann über <Link to={fullUrl} target="_blank" rel="noopener noreferrer">{fullUrl}</Link> aufgerufen werden.</p>}
	</FormPart>
}

function RemoveSimulation({ simulation }) {
	const userId = useUserId()
	const navigate = useNavigate()
	const lastOwner = simulation.owners.length === 1

	// Set up a handler for deleting the simulation.
	const confirmRemoval = async () => {
		if (userId && window.confirm(lastOwner ? 'Sind Sie sicher, dass Sie die Simulation dauerhaft löschen wollen?' : 'Sind Sie sicher, dass Sie sich selbst als Eigentümer dieser Simulation löschen möchten?')) {
			await unlinkUserFromSimulation(userId, simulation.id)
			navigate('/create')
		}
	}

	if (lastOwner) {
		return <>
			<h2>Simulation löschen</h2>
			<p>Sie sind der einzige Eigentümer dieser Simulation. Wenn Sie sie entfernen, wird sie dauerhaft gelöscht. Alle Spuren werden aus dem Datenspeicher entfernt und niemand wird mehr in der Lage sein, sie zu spielen.</p>
			<Button variant="contained" onClick={confirmRemoval} sx={{ mb: '1rem' }}>Simulation löschen</Button>
		</>
	}

	return <>
		<h2>Sich entfernen als Eigentümer</h2>
		<p>Es gibt mehrere Eigentümer dieser Simulation. Sie können sich selbst als Eigentümer entfernen. Die Simulation bleibt bestehen und kann von dem/den verbleibenden Eigentümer(n) verwaltet werden.</p>
		<Button variant="contained" onClick={confirmRemoval} sx={{ mb: '1rem' }}>Sich entfernen als Eigentümer</Button>
	</>
}
