import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useUserId } from 'fb'
import { useSimulation } from 'simulations'
import { Page, useTab } from 'components'

import { hasVariables } from '../util'

import { Settings } from './settings'
import { Pages } from './pages'
import { Variables } from './variables'
import { Events } from './events'

const EditPage = ({ children, tabs }) => <Page title="Simulation bearbeiten" backButton="/create" tabs={tabs}>{children}</Page>

export function Edit() {
	const userId = useUserId()
	const navigate = useNavigate()
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)

	// When the simulation is missing, or the user has no rights to it, go back to the create page.
	useEffect(() => {
		if (simulation === null || (simulation && !simulation.owners.includes(userId)))
			navigate('/create')
	}, [simulation, userId, navigate])

	// On missing data, we're probably still loading the simulation.
	if (!simulation)
		return <EditPage><p>Simulation laden...</p></EditPage>

	// Show the simulation form itself.
	const tabs = ['Einstellungen', 'Seiten', 'Parameter']
	if (hasVariables(simulation))
		tabs.push('Ereignisse')
	return <EditPage tabs={tabs}>
		<EditForSimulation simulation={simulation} />
	</EditPage>
}

function EditForSimulation({ simulation }) {
	const tab = useTab()
	const Component = [Settings, Pages, Variables, Events][tab]
	return <Component simulation={simulation} />
}
