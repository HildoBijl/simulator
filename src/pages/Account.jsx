import Button from '@mui/material/Button'

import { useUser, useSignedInCheck, signOut } from '../firebase'
import { Page } from '../components'

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
		<p>Sie sind angemeldet als {user.displayName} &lt;{user.email}&gt;.</p>
		<Button variant="contained" onClick={signOut}>Abmelden</Button>
	</AccountPage>
}
