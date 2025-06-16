import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useUserId } from 'fb'
import { useSimulation } from 'simulations'
import { Page, useTab } from 'components'

import { Settings } from './settings'
import { Pages } from './pages'
import { Variables } from './variables'

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

	// If a lockedAfter timestamp has been defined, and if it's in the past, then show a note that the simulation cannot be changed.
	if (simulation.lockedAfter && simulation.lockedAfter < new Date())
		return <EditPage><p>Simulation ist gesperrt. Sie können die Simulation nicht mehr bearbeiten, da der dafür vorgesehene Zeitraum überschritten wurde.</p></EditPage>

	// Show the simulation form itself.
	const tabs = ['Einstellungen', 'Seiten', 'Parameter']
	return <EditPage tabs={tabs}>
		<EditForSimulation simulation={simulation} />
	</EditPage>
}

function EditForSimulation({ simulation }) {
	const tab = useTab()
	const Component = [Settings, Pages, Variables][tab]
	return <Component simulation={simulation} />
}
