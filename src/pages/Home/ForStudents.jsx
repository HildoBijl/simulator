import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useTheme, styled } from '@mui/material/styles'
import { Clear } from '@mui/icons-material'

import { useSimulation } from 'simulations'

export function ForStudents() {
	const getOverview = () => JSON.parse(localStorage.getItem('simulationOverview') || '{}')
	const [overview, setOverview] = useState(getOverview())
	const refreshOverview = () => setOverview(getOverview())
	const hasGames = Object.keys(overview).length > 0

	return <div>
		<h2>Für Studierenden</h2>
		<p>Erhalten Sie einen Link zu einer Simulation von einem Lehrer/Simulationsersteller, um diese zu starten.{hasGames ? <> Oder spielen Sie eine Ihrer früheren Simulationen weiter.</> : null}</p>
		{hasGames ? <SimulationPlayOverview overview={overview} refreshOverview={refreshOverview} /> : null}
	</div>
}

const Grid = styled('div')({
	boxSizing: 'border-box',
	display: 'grid',
	gridTemplateColumns: '[start] 5fr minmax(60px, 1fr) 40px [end]',
	padding: '1rem 0.5rem',
	width: '100%',

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
		paddingLeft: '0.4rem',
		textAlign: 'left',
	},
	'& .numPlayed': {
		textAlign: 'center',
	},
	'& .delete': {
		textAlign: 'center',
	},
})

function SimulationPlayOverview({ overview, refreshOverview }) {
	const [hoverRow, setHoverRow] = useState()
	return <Grid>
		<div className="title head">Titel</div>
		<div className="numPlayed head">Läufe</div>
		<div className="delete head"></div>
		{Object.keys(overview).map(simulationId => <OverviewLine key={simulationId} simulationId={simulationId} data={overview[simulationId]} hovering={hoverRow === simulationId} startHover={() => setHoverRow(simulationId)} endHover={() => setHoverRow()} refreshOverview={refreshOverview} />)}
	</Grid>
}

function OverviewLine({ simulationId, data, hovering, startHover, endHover, refreshOverview }) {
	const theme = useTheme()

	// Load the simulation data.
	let simulation = useSimulation(simulationId)
	if (!simulation)
		simulation = { title: 'Laden...' }

	// Set up a navigation function.
	const navigate = useNavigate()
	const onClick = () => simulation?.url && navigate(`/s/${simulation.url}`)

	// Set up a function to remove this item from the list.
	const remove = () => {
		const overview = JSON.parse(localStorage.getItem('simulationOverview') || '{}')
		delete overview[simulation.id]
		localStorage.setItem('simulationOverview', JSON.stringify(overview))
		refreshOverview()
	}

	// Show a row for the simulation.
	const title = simulation.title || 'Unbekannter Titel'
	return <>
		<div className={clsx('title', 'row', 'clickable', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{title}</div>
		<div className={clsx('numPlayed', 'row', 'clickable', { hovering })} onClick={onClick} onMouseOver={startHover} onMouseOut={endHover}>{data.numPlayed || 0}</div>
		<div className={clsx('row', 'clickable', { hovering })} onClick={remove} onMouseOver={startHover} onMouseOut={endHover}><Clear sx={{ color: theme.palette.error.main, transform: 'translateY(2px)' }} /></div>
	</>
}
