import { useNavigate } from 'react-router-dom'

import { useAuthData, signOut } from '../firebase'
import { Page } from '../components'

export function Account() {
	const navigate = useNavigate()
	const { user, loading } = useAuthData()

	// Not logged in? Go back.
	if (!user) {
		if (!loading)
			navigate('/create')
		return <p>Loading user data...</p>
	}

	// Set up the page.
	return <Page title="Konto" backButton="/create">
		<p>Signed in as {user.displayName} &lt;{user.email}&gt;</p>
		<button onClick={signOut}>Sign out</button>
	</Page>
}
