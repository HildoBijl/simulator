import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useSimulation } from '../../../simulations'
import { Page, useTab } from '../../../components'

import { Settings } from './Settings'
import { Questions } from './Questions'

const EditPage = ({ children, tabs }) => <Page title="Simulation bearbeiten" backButton="/create" tabs={tabs}>{children}</Page>

export function Edit() {
	const navigate = useNavigate()
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)

	// When the simulation is missing, go back to the create page.
	useEffect(() => {
		if (simulation === null)
			navigate('/create')
	}, [simulation, navigate])

	// On missing data, we're probably still loading the simulation.
	if (!simulation)
		return <EditPage><p>Simulation laden...</p></EditPage>

	// Show the simulation form itself.
	return <EditPage tabs={['Einstellungen', 'Fragen']}>
		<EditForSimulation simulation={simulation} />
	</EditPage>
}

function EditForSimulation({ simulation }) {
	const tab = useTab()
	const Component = [Settings, Questions][tab]
	return <Component simulation={simulation} />
}
