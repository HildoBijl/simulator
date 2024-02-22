import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { collection, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useCollection } from 'react-firebase-hooks/firestore'

function App() {
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

  // Allow play count increment.
  const increment = async (id) => {
    const oldData = value.docs.find(doc => doc.id === id).data()
    await setDoc(doc(db, 'games', id), { playCount: oldData.playCount + 1 }, { merge: true })
  }

  // Render the component.
  if (!value || loading || error)
    return null
  return (
    <>
      <div>
        {/* <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a> */}
      </div>
      <h1>Führungssimulator</h1>
      {value.docs.map(doc => {
        return <div className="card" key={doc.id}>
          <p>Simulation title is <strong>{doc.data().name}</strong>. Number of plays: <strong>{doc.data().playCount}</strong>.</p>
          <button onClick={() => increment(doc.id)}>
            Play this game!
          </button>
        </div>
      })}
      <h2>Add game</h2>
      <input type="text" name="gameName" value={name} onChange={(evt) => setName(evt.target.value)} />
      <button onClick={addGame}>
        Add game
      </button>
    </>
  )
}

export default App
