import { useState } from 'react'
import { collection, doc, setDoc } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import Button from '@mui/material/Button'

import { db, useAuthData, signInWithGoogleRedirect } from '../firebase'
import { Page } from '../components'

const title = 'Simulationsübersicht'

export function Create() {
  const { user, loading } = useAuthData()
  if (!user) {
    if (!loading)
      return <CreateAsStranger />
    return <Page title={title} showLogo={true}><p>Anmeldestatus überprüfen...</p></Page>
  }
  return <CreateAsUser />
}

export function CreateAsStranger() {
  return <Page title={title} showLogo={true}>
    <h2>Anmeldung erforderlich</h2>
    <p>Um eine neue Simulation zu erstellen, müssen Sie angemeldet sein. Zurzeit ist es nur möglich, sich über Google anzumelden.</p>
    <Button variant="contained" onClick={signInWithGoogleRedirect} sx={{ mt: 1 }}>Anmeldung über Google</Button>
  </Page>
}

export function CreateAsUser() {
  // Load game data.
  const [value, loading, error] = useCollection(collection(db, 'games'))

  // Set up input field.
  const [name, setName] = useState('')
  const addGame = async () => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (id.length < 2 || value.docs.find(doc => doc.id === id))
      return
    const data = { name, playCount: 0 }
    await setDoc(doc(db, 'games', id), data)
  }

  // Render the component.
  if (!value || loading || error)
    return <Page title={title} showLogo={true}><p>Loading games...</p></Page>
  return (
    <Page title={title} showLogo={true}>
      <h2>Add game</h2>
      <input type="text" name="gameName" value={name} onChange={(evt) => setName(evt.target.value)} />
      <button onClick={addGame}>
        Add game
      </button>
    </Page>
  )
}
