import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useUserId } from 'fb'
import { useSimulation } from 'simulations'
import { Page } from 'components'

import { Description } from './Description'
import { Download } from './Download'
import { Upload } from './Upload'

const EditPage = ({ children, tabs }) => {
	const { simulationId } = useParams()
	return <Page title="Simulation importieren/exportieren" backButton={`/create/${simulationId}`} tabs={tabs}>{children}</Page>
}

export function Import() {
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

	// Render the page.
	return <ImportForSimulation {...{ simulation }} />
}

function ImportForSimulation({ simulation }) {
	return <EditPage>
		<Description />
		<Download {...{ simulation }} />
		<Upload {...{ simulation }} />
	</EditPage>
}
