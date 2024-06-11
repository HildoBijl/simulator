import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { useUser, useSignedInCheck, signOut, removeUserData } from 'fb'
import { removeUserFromAllSimulations } from 'simulations'
import { Page } from 'components'

const AccountPage = ({ children }) => <Page title="Konto" backButton="/create">{children}</Page>

export function Account() {
	const user = useUser()

	// Not logged in? Go back.
	useSignedInCheck('/create')

	// Still verifying the user? Show a loading message.
	if (!user)
		return <AccountPage><p>Anmeldestatus überprüfen...</p></AccountPage>

	// Set up the page.
	return <AccountPage>
		<SignInStatus />
		<DeleteAccount />
	</AccountPage>
}

function SignInStatus() {
	const user = useUser()
	return <>
		<p>Sie sind angemeldet als {user.displayName} &lt;{user.email}&gt;.</p>
		<Button variant="contained" onClick={signOut}>Abmelden</Button>
	</>
}

const TextFieldStyled = styled(TextField)(() => ({
	marginBottom: '0.5rem',
	marginRight: '1rem',
	width: 'min(50ch, 100%)',

	'& input': {
		background: 'white',
	}
}))

function DeleteAccount() {
	const navigate = useNavigate()
	const user = useUser()
	const [confirmEmail, setConfirmEmail] = useState('')
	const [lastSubmission, setLastSubmission] = useState()
	const [deleting, setDeleting] = useState(false)

	const submitForm = async (evt) => {
		evt.preventDefault()
		setLastSubmission(confirmEmail)

		// Run final checks.
		if (confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase())
			return // Check failed.
		setDeleting(true)

		// Delete the user. Start with the most specific ones and end with the most fundamental ones.
		await removeUserFromAllSimulations(user.uid)
		await removeUserData(user.uid)
		await user.delete()
		navigate('/')
	}

	let isError = false, helperText = ''
	if (deleting) {
		helperText = 'Konto löschen...'
	} else if (confirmEmail === lastSubmission && !deleting) {
		isError = true
		helperText = 'Konto konnte nicht gelöscht werden. Diese E-Mail-Adresse ist nicht mit Ihrem Konto verbunden.'
	}

	return <>
		<h2>Konto löschen</h2>
		<p>Wenn Sie Ihr Konto löschen, werden <strong>alle</strong> Ihre Daten gelöscht. Die Simulationen, deren alleiniger Eigentümer Sie sind, werden ebenfalls entfernt. Dies kann nicht rückgängig gemacht werden! Natürlich können Sie danach ein komplett neues Konto erstellen, aber das fängt dann wieder bei Null an.</p>
		<p>Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Geben Sie dann Ihre E-Mail-Adresse zur Bestätigung unten ein.</p>
		<form noValidate autoComplete="off" onSubmit={submitForm}>
			<TextFieldStyled id="confirmEmail" label="E-Mail-Adresse" variant="outlined" size="small" value={confirmEmail} onChange={(evt) => setConfirmEmail(evt.target.value)} error={isError} helperText={helperText} />
			<Button variant="contained" onClick={submitForm}>Konto löschen</Button>
		</form>
	</>
}
