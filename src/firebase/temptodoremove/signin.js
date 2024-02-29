import { app } from '../main'
import { signInWithRedirect, getAuth, GoogleAuthProvider, getRedirectResult } from 'firebase/auth'

const provider = new GoogleAuthProvider()

const auth = getAuth(app)
auth.languageCode = 'de'


export default async function signIn() {
	let result = null, error = null
	try {
		await signInWithRedirect(auth, provider)
		result = await getRedirectResult(auth)
		const credential = GoogleAuthProvider.credentialFromResult(result)
		const token = credential.accessToken
		const user = result.user
		console.log(credential, token, user)
	} catch (e) {
		error = e
	}

	return { result, error }
}
