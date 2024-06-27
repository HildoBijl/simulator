import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import clsx from 'clsx'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'

import { getBaseUrl } from 'util'
import { useAuthData, useUserId, signInWithGoogleRedirect, useUser } from 'fb'
import { useSimulationIds, createNewSimulation, useSimulation, useUserInvites, deleteSimulationInvite, acceptSimulationInvite } from 'simulations'
import { Page } from 'components'

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
  },
  '& .clickable': {
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
      <InvitesOverview />
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
    <div className={clsx('title', 'row', 'clickable', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{title}</div>
    <div className={clsx('url', 'row', 'clickable', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{simulation.url ? <Link to={`${getBaseUrl()}/s/${simulation.url}`}>{simulation.url}</Link> : '-'}</div>
    <div className={clsx('numPlayed', 'row', 'clickable', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{simulation.numPlayed || 0}</div>
    <div className={clsx('numFinished', 'row', 'clickable', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{simulation.numFinished || 0}</div>
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

function InvitesOverview() {
  const user = useUser()
  let invites = useUserInvites() // New invites.
  const simulationIds = useSimulationIds() // What is already owned.

  // On loading, or on missing invites, render nothing.
  if (!invites)
    return null // Loading or error.

  // When the user already owns a simulation, remove it from the user's invite list.
  const alreadyOwnedInvites = invites.filter(simulationId => simulationIds.includes(simulationId))
  if (alreadyOwnedInvites.length > 0) {
    alreadyOwnedInvites.forEach(simulationId => {
      deleteSimulationInvite(simulationId, user.email)
    })
  }

  // Don't render invites to already owned simulations.
  const filteredInvites = invites.filter(simulationId => !simulationIds.includes(simulationId))
  if (filteredInvites.length === 0)
    return null

  // Render the invites.
  return <>
    <h2>Einladungen zum Simulationsbesitz</h2>
    <Grid>
      {filteredInvites.map(simulationId => <SimulationInvite key={simulationId} {...{ simulationId }} />)}
      {/* Empty row to get a bottom bar. */}
      <div className={clsx('title', 'row')}></div>
      <div className={clsx('url', 'row')}></div>
      <div className={clsx('numPlayed', 'row')}></div>
      <div className={clsx('numFinished', 'row')}></div>
    </Grid>
  </>
}

function SimulationInvite({ simulationId }) {
  const user = useUser()
  let simulation = useSimulation(simulationId)

  // When the simulation has been removed, also remove it from the user's invite list.
  if (simulation === null)
    deleteSimulationInvite(simulationId, user.email)

  // Render the simulation.
  if (!simulation)
    simulation = { title: 'Laden...' }
  const title = simulation.title || 'Unbekannter Titel'
  return <>
    <div className={clsx('title', 'row')}>{title}</div>
    <div className={clsx('url', 'row')}>{simulation.url ? <Link to={`${getBaseUrl()}/s/${simulation.url}`}>{simulation.url}</Link> : '-'}</div>
    <div className={clsx('numPlayed', 'row')}><Link onClick={() => acceptSimulationInvite(simulationId, user)}>Akzeptieren</Link></div>
    <div className={clsx('numFinished', 'row')}><Link onClick={() => deleteSimulationInvite(simulationId, user?.email)}>Löschen</Link></div>
  </>
}
