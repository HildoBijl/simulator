import { useParams } from 'react-router-dom'

import { useSimulation } from '../../simulations'
import { Page } from '../../components'

const EditPage = ({ children }) => <Page title="Simulation bearbeiten" backButton="/create">{children}</Page>

export function Edit() {
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)
	if (!simulation)
		return <EditPage><p>Simulation laden...</p></EditPage>
	return <EditPage><p>{JSON.stringify(simulation)}</p></EditPage>
}
