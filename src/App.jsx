import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { collection, doc, addDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useCollection } from 'react-firebase-hooks/firestore'

function App() {
  // Load game data.
  const [value, loading, error] = useCollection(collection(db, 'games'))
  if (!value || loading || error)
    return null

  // Allow play count increment.
  const increment = async (id) => {
    const oldData = value.docs.find(doc => doc.id === id).data()
    const newData = { ...oldData, playCount: oldData.playCount + 1 }
    await setDoc(doc(db, 'games', id), newData)
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
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
    </>
  )
}

export default App
