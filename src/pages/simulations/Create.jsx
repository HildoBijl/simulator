import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import clsx from 'clsx'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'

import { getBaseUrl } from '../../util'
import { useAuthData, useUserId, signInWithGoogleRedirect } from '../../firebase'
import { useSimulationIds, createNewSimulation, useSimulation } from '../../simulations'
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

const Grid = styled('div')({
  display: 'grid',
  margin: '1rem 0',
  gridTemplateColumns: '[start] 5fr minmax(120px, 1fr) repeat(2, minmax(60px, 1fr)) [end]',

  '& > div': {
    lineHeight: '1.5rem',
    padding: '0.6rem 0.2rem',
  },

  '& .head': {
    fontWeight: 'bold',
  },
  '& .row': {
    borderTop: '1px solid #555555',
    '@media (prefers-color-scheme: light)': {
      borderTop: '1px solid #cccccc',
    },
    cursor: 'pointer',
  },
  '& .hovering': {
    backgroundColor: '#2c2c2c',
    '@media (prefers-color-scheme: light)': {
      background: '#f2f1f0',
    },
  },

  '& .title': {

  },
  '& .url': {
    textAlign: 'center',
  },
  '& .numPlayed': {
    textAlign: 'center',
  },
  '& .numFinished': {
    textAlign: 'center',
  },

  '& .newGame': {
    borderTop: '1px solid #555555',
    '@media (prefers-color-scheme: light)': {
      borderTop: '1px solid #cccccc',
    },
    cursor: 'pointer',
    fontSize: '2em',
    gridColumn: 'start / end',
    textAlign: 'center',
    '& > span': {
      display: 'inline-block',
      transform: 'translateY(-3px)',
    },

    '&:hover': {
      backgroundColor: '#2c2c2c',
      '@media (prefers-color-scheme: light)': {
        background: '#f2f1f0',
      },
    },

    '&.addingGame': {
      backgroundColor: '#353535',
      '@media (prefers-color-scheme: light)': {
        background: '#e7e6e5',
      },
    },
  }
})

export function CreateAsUser() {
  const simulationIds = useSimulationIds()
  const [hoverRow, setHoverRow] = useState()
  const navigate = useNavigate()

  // When no data is available, show a loading note.
  if (!simulationIds)
    return <CreatePage><p>Simulationsdaten laden...</p></CreatePage>

  // Render the component.
  return (
    <CreatePage>
      <Grid>
        <div className="title head">Titel</div>
        <div className="url head">URL</div>
        <div className="numPlayed head">Angef.</div>
        <div className="numFinished head">Abges.</div>
        {simulationIds.map(simulationId => <Simulation key={simulationId} id={simulationId} onClick={() => navigate(`/create/${simulationId}`)} hovering={hoverRow === simulationId} startHover={() => setHoverRow(simulationId)} endHover={() => setHoverRow()} />)}
        <NewSimulation />
      </Grid>
    </CreatePage>
  )
}

function Simulation({ id, hovering, startHover, endHover, onClick }) {
  // Load the simulation data.
  let simulation = useSimulation(id)
  if (!simulation)
    simulation = { title: 'Laden...' }

  // Show a row for the simulation.
  const title = simulation.title || 'Unbekannter Titel'
  return <>
    <div className={clsx('title', 'row', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{title}</div>
    <div className={clsx('url', 'row', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{simulation.url ? <Link to={`${getBaseUrl()}/s/${simulation.url}`}>{simulation.url}</Link> : '-'}</div>
    <div className={clsx('numPlayed', 'row', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{simulation.numPlayed || 0}</div>
    <div className={clsx('numFinished', 'row', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{simulation.numFinished || 0}</div>
  </>
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
  return <div className={clsx('newGame', { addingGame })} onClick={newGame}><span>+</span></div>
}
