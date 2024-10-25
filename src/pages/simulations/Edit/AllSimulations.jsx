import { isLocalhost } from 'util'

import { useAllSimulationIds, useSimulation } from 'simulations'

// AllSimulations loads a component for ALL simulations. This is generally only used when a database overhaul is performed, and a change/update has to be performed on all simulations.
export function AllSimulations() {
	// Never load ALL simulations outside of localhost.
	if (!isLocalhost())
		return null
	return <ReallyAllSimulations />
}

function ReallyAllSimulations() {
	const allSimulationIds = useAllSimulationIds()
	return allSimulationIds.map(simulationId => <Simulation key={simulationId} simulationId={simulationId} />)
}

function Simulation({ simulationId }) {
	const simulation = useSimulation(simulationId)
	if (!simulation)
		return <p>Loading simulation...</p>
	return <p>{simulation.id} - {simulation.title || '[Simulation without title]'}</p>
}
