import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { getBaseUrl } from '../../util'
import { useUserId } from '../../firebase'
import { useSimulation, unlinkUserFromSimulation, getSimulationByUrl, updateSimulation } from '../../simulations'
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
		<ChangeUrl simulation={simulation} />
		<ChangeDescription simulation={simulation} />
		<ChangeMedia simulation={simulation} />
		<RemoveSimulation simulation={simulation} />
	</EditPage>
}

function ChangeTitle({ simulation }) {
	// Set up a handler that saves the title.
	const [title, setTitle] = useState(simulation?.title || '')
	const setAndSaveTitle = async (title) => {
		setTitle(title)
		await updateSimulation(simulation.id, { title })
	}

	// Render the form part.
	return <>
		<h2>Titel</h2>
		<p>Der Titel ist das, was die Studierenden beim ersten Öffnen der Simulation sehen.</p>
		<TextField variant="outlined" fullWidth label="Titel" value={title} onChange={(event) => setAndSaveTitle(event.target.value)} />
	</>
}

function ChangeUrl({ simulation }) {
	// Set up a handler that, upon a change, filters out unwanted symbols, checks for duplicates, and if all is in order saves the URL.
	const [url, setUrl] = useState(simulation?.url || '')
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
	return <>
		<h2>URL</h2>
		<p>Die URL ist der Link, über den der Zugriff auf die Simulation erfolgt. Sie muss in Kleinbuchstaben ohne Leerzeichen angegeben werden.</p>
		<TextField variant="outlined" fullWidth label="URL" value={url} onChange={(event) => setAndSaveUrl(event.target.value)} />
		{url.length < minUrlCharacters ?
			<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Die URL muss mindestens zwei Zeichen lang sein.</p> :
			conflict ?
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Eine Simulation mit der URL &quot;{url}&quot; existiert bereits. Versuchen Sie eine andere URL.</p> :
				<p>Die Simulation kann über <Link to={fullUrl}>{fullUrl}</Link> aufgerufen werden.</p>}
	</>
}

function ChangeDescription({ simulation }) {
	const [description, setDescription] = useState(simulation?.description || '')
	const setAndSaveDescription = async (description) => {
		setDescription(description)
		await updateSimulation(simulation.id, { description })
	}

	return <>
		<h2>Beschreibung</h2>
		<p>Die Beschreibung ist die Geschichte, die oben auf der Titelseite erscheint.</p>
		<TextField variant="outlined" fullWidth multiline label="Beschreibung" value={description} onChange={(event) => setAndSaveDescription(event.target.value)} />
	</>
}

function ChangeMedia({ simulation }) {
	// Set up a handler that saves the title.
	const [image, setImage] = useState(simulation?.image || '')
	const setAndSaveImage = async (image) => {
		setImage(image)
		await updateSimulation(simulation.id, { image })
	}

	// Render the form part.
	return <>
		<h2>Abbildung</h2>
		<p>You can enter a URL to a picture. This will then appear on the site.</p>
		<TextField variant="outlined" fullWidth label="Abbildung" value={image} onChange={(event) => setAndSaveImage(event.target.value)} />
	</>
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
