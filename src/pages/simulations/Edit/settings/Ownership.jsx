import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { FormPart } from 'components'
import { registerSimulationInvite, useSimulationInvites } from 'simulations'

// Ownership is used to manage ownership of the simulation: invite new owners when desired.
export function Ownership({ simulation }) {
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
		<p>Derzeit hat diese Simulation {simulation.owners.length === 1 ? 'nur einen' : simulation.owners.length} Besitzer. Sie können Besitzer einladen, indem Sie ihre E-Mail-Adresse hier eingeben. Beachten Sie: Dies muss die Adresse sein, mit der sie sich bei dieser App anmelden.</p>
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
