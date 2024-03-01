import { collection, doc, setDoc } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { useNavigate } from 'react-router-dom'

import { db } from '../firebase'
import { Page } from '../components'

export function Home() {
  // Load in navigation.
  const navigate = useNavigate()

  // Load game data.
  const [value, loading, error] = useCollection(collection(db, 'games'))

  // Allow play count increment.
  const increment = async (id) => {
    const oldData = value.docs.find(doc => doc.id === id).data()
    await setDoc(doc(db, 'games', id), { playCount: oldData.playCount + 1 }, { merge: true })
  }

  // Render the component.
  if (!value || loading || error)
    return null
  return (
    <Page addAppBar={false}>
      <h1>Führungssimulator</h1>
      <p>Welcome student! You can play the games below.</p>
      {value.docs.map(doc => {
        return <div className="card" key={doc.id}>
          <p>Simulation title is <strong>{doc.data().name}</strong>. Number of plays: <strong>{doc.data().playCount}</strong>.</p>
          <button onClick={() => increment(doc.id)}>
            Play this game!
          </button>
        </div>
      })}
      <h2>Create new simulation</h2>
      <p>Are you a teacher? Then you can build your own simulation.</p>
      <button onClick={() => navigate('/create')}>Create new simulation</button>
    </Page>
  )
}
