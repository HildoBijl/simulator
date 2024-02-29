import { useAuthData, signInWithGoogleRedirect, signOut } from '../firebase'

export function Test() {
	const { user, loading } = useAuthData()
	console.log(user)

	return <>
		{user ? <p>Signed in as {user.displayName} &lt;{user.email}&gt;</p> : <p>You can sign in here.</p>}
		{loading ? <p>Loading user data...</p> : null}
		{!loading && !user ? <button onClick={signInWithGoogleRedirect}>Sign in through Google</button> : null}
		{!loading && user ? <button onClick={signOut}>Sign out</button> : null}
	</>
}
