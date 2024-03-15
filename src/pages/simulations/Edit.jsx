import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { useUserId } from '../../firebase'
import { useSimulation, unlinkUserFromSimulation, updateSimulation } from '../../simulations'
import { Page } from '../../components'

const EditPage = ({ children }) => <Page title="Simulation bearbeiten" backButton="/create">{children}</Page>

export function Edit() {
	const navigate = useNavigate()
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)

	// When the simulation is missing, go back to the create page.
	useEffect(() => {
		if (simulation === null)
			navigate('/create')
	}, [simulation, navigate])

	// On missing data, we're probably still loading the simulation.
	if (!simulation)
		return <EditPage><p>Simulation laden...</p></EditPage>

	// Show the simulation form itself.
	return <EditForSimulation simulation={simulation} />
}

function EditForSimulation({ simulation }) {
	return <EditPage>
		<ChangeTitle simulation={simulation} />
		<RemoveSimulation simulation={simulation} />
	</EditPage>
}

function ChangeTitle({ simulation }) {
	const [title, setTitle] = useState(simulation?.title || '')
	const setAndSaveTitle = async (title) => {
		setTitle(title)
		await updateSimulation(simulation.id, { title })
	}

	return <div style={{ margin: '2.5rem 0 1rem' }}><TextField variant="outlined" label="Titel" value={title} onChange={(event) => setAndSaveTitle(event.target.value)} /></div>
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
			<Button variant="contained" onClick={confirmRemoval}>Simulation löschen</Button>
		</>
	}

	return <>
		<h2>Sich entfernen als Eigentümer</h2>
		<p>Es gibt mehrere Eigentümer dieser Simulation. Sie können sich selbst als Eigentümer entfernen. Die Simulation bleibt bestehen und kann von dem/den verbleibenden Eigentümer(n) verwaltet werden.</p>
		<Button variant="contained" onClick={confirmRemoval}>Sich entfernen als Eigentümer</Button>
	</>
}
