import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'

import { useAuthData, useUserId, signInWithGoogleRedirect } from '../../firebase'
import { useSimulationIds, createNewSimulation } from '../../simulations'
import { Page } from '../../components'

const CreatePage = ({ children }) => <Page title="Simulationsübersicht" showLogo={true}>{children}</Page>

export function Create() {
  const { user, loading } = useAuthData()
  if (user)
    return <CreateAsUser />
  if (loading)
    return <CreatePage><p>Anmeldestatus überprüfen...</p></CreatePage>
  return <CreateAsStranger />
}

export function CreateAsStranger() {
  return <CreatePage>
    <h2>Anmeldung erforderlich</h2>
    <p>Um eine neue Simulation zu erstellen, müssen Sie angemeldet sein. Zurzeit ist es nur möglich, sich über Google anzumelden.</p>
    <Button variant="contained" onClick={signInWithGoogleRedirect} sx={{ mt: 1 }}>Anmeldung über Google</Button>
  </CreatePage>
}

export function CreateAsUser() {
  const simulationIds = useSimulationIds()

  // When no data is available, show a loading note.
  if (!simulationIds)
    return <CreatePage><p>Simulationsdaten laden...</p></CreatePage>

  // Render the component.
  return (
    <CreatePage>
      {simulationIds.map(simulationId => <Simulation key={simulationId} id={simulationId} />)}
      <NewSimulation />
    </CreatePage>
  )
}

function Simulation({ id }) {
  const navigate = useNavigate()
  return <div onClick={() => navigate(`/create/${id}`)}>{id}</div>
}

function NewSimulation() {
  const userId = useUserId()
  const navigate = useNavigate()

  // Set up a handler that creates a new game.
  const [addingGame, setAddingGame] = useState(false)
  const newGame = async () => {
    setAddingGame(true)
    const simulationId = await createNewSimulation(userId)
    navigate(`/create/${simulationId}`)
    setAddingGame(false)
  }

  // Render the button to add a new simulation.
  return <button onClick={newGame}>{!addingGame ? 'New game' : 'Adding game...'}</button>
}
