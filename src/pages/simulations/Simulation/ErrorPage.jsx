import Alert from '@mui/material/Alert'

import { useUserId } from '../../../firebase'
import { Page } from '../../../components'

import { emptyVariableName, emptyVariableTitle } from '../settings'
import { getVariableErrorMessage } from '../validation'

const components = { // Map the error types to components that can display them.
	variable: VariableError,
}

export function ErrorPage({ simulation, error }) {
	// Determine if the current user owns the simulation. This means more info can be shown.
	const userId = useUserId()
	const isOwner = simulation.owners.includes(userId)

	// Find the right component to display.
	const Component = components[error.type]
	if (!Component)
		throw new Error(`Invalid simulation validation error: received an error of type "${error.type}" but this type has no known component yet to display the error properly.`)

	return <Page title={simulation.title || '[Simulationstitel fehlt]'}>
		<StandardMessage />
		{isOwner ? <Alert severity="error" sx={{ my: 2 }}>
			<h5 style={{ margin: '0.25rem 0' }}>Informationen für Simulationsentwickler</h5>
			<Component simulation={simulation} error={error} />
		</Alert> : null}
	</Page>
}

function StandardMessage() {
	return <Alert severity="warning" sx={{ my: 2 }}>
		<h5 style={{ margin: '0.25rem 0' }}>Inkonsistenz in der Simulation</h5>
		<p>Derzeit gibt es eine Inkonsistenz in den Simulationseinstellungen. Dies bedeutet in der Regel, dass der Ersteller einige Änderungen vornimmt und die Dinge derzeit nicht zusammenpassen. Bitte warten Sie ein wenig, bis die Simulation wieder funktioniert. (Sie brauchen nicht zu aktualisieren: Sie erscheint, wenn sie fertig ist).</p>
	</Alert>
}

function VariableError({ error }) {
	const { variable } = error
	const message = getVariableErrorMessage(error)
	return <p>Es gibt einen Fehler in der Definition des Parameters {variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}. {message}</p>
}
