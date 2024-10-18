import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { deleteField } from 'firebase/firestore'

import { getBaseUrl, useTrackedState } from 'util'
import { useUserId } from 'fb'
import { FormPart, TrackedTextField } from 'components'
import { unlinkUserFromSimulation, getSimulationByUrl, updateSimulation, registerSimulationInvite, useSimulationInvites } from 'simulations'

export function Settings({ simulation }) {
	return <>
		<ChangeUrl simulation={simulation} />
		<FormPart>
			<TrackedTextField label="Titel (z.B. Meine erste Simulation)" value={simulation.title} path="simulations" documentId={simulation.id} field="title" />
		</FormPart>
		{simulation.questionList.length !== 0 ? <Alert severity="info" sx={{ my: 2 }}>Tipp: Öffnen Sie Ihre Simulation als &quot;Benutzer&quot; in einem zweiten Browser-Tab über den obigen Link. Um Ihre Simulation zu erstellen, fügen Sie dann über &quot;Seiten&quot; (oben) Seiten hinzu. Sie können Ihre Änderungen live verfolgen.</Alert> : null}
		<h2>Sonstige Einstellungen</h2>
		<AllowUndo simulation={simulation} />
		<Ownership simulation={simulation} />
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

function AllowUndo({ simulation }) {
	return <FormPart>
		<FormGroup sx={{ px: '0.5rem' }}>
			<FormControlLabel control={<Switch checked={simulation.allowUndo || false} onChange={event => updateSimulation(simulation.id, { allowUndo: event.target.checked || deleteField() })} label="Allow Undo" />} label="Benutzern die Möglichkeit geben, ihre Aktionen rückgängig zu machen." />
		</FormGroup>
	</FormPart>
}

function Ownership({ simulation }) {
	const [email, setEmail] = useState('')
	const [errorEmail, setErrorEmail] = useState()
	const [invitedEmail, setInvitedEmail] = useState()

	// The handleEmailChange handler updates the typed-in email address.
	const handleEmailChange = (event) => {
		setEmail(event.target.value.toLowerCase())
		setInvitedEmail() // Remove any invite notification.
	}

	// The registerInvite handler checks the input, and if it's OK, registers the invite.
	const registerInvite = (event) => {
		// Prevent page refresh.
		event.preventDefault()

		// On a faulty email, remember the error.
		if (!email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
			setErrorEmail(email)
			return
		}

		// Add the email address to the simulation within the database.
		registerSimulationInvite(simulation.id, email)

		// On a success, register the invite for confirmation and empty the field.
		setInvitedEmail(email)
		setEmail('')
	}

	// Load existing invites. Not because we need them, but just to check it if there's zero, so we can remove the respective document from the database.
	useSimulationInvites(simulation.id)

	// Render the form part.
	const theme = useTheme()
	return <>
		<h2>Simulationseigentümer</h2>
		<p>Derzeit hat diese Simulation {simulation.owners.length === 1 ? 'nur einen' : simulation.owners.length} Besitzer. Sie können Besitzer einladen, indem Sie ihre E-Mail-Adresse hier eingeben.</p>
		<form onSubmit={registerInvite}>
			<FormPart>
				<TextField variant="outlined" fullWidth label="E-Mail Adresse" value={email} onChange={handleEmailChange} />
				{errorEmail && errorEmail === email ? <p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Leider ist {errorEmail} keine gültige E-Mail Adresse.</p> : null}
				{invitedEmail ? <p style={{ color: theme.palette.success.main, fontWeight: 500 }}>Einladung registriert. Wenn sich der Besitzer von {invitedEmail} anmeldet, sieht er/sie die Einladung in seiner/ihrer Hauptsimulationsübersicht.</p> : null}
			</FormPart>
			<Button variant="contained" onClick={registerInvite}>Einladung registrieren</Button>
		</form>
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
