import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

import { numberToLetter } from 'util'
import { Page } from 'components'
import { useIsOwner } from 'simulations'

import { emptyQuestion, emptyOption, emptyVariableName, emptyVariableTitle, emptyEventTitle } from '../../settings'
import { getVariableErrorMessage } from '../../validation'

const components = { // Map the error types to components that can display them.
	// Simulation errors.
	variable: VariableError,
	updateScript: UpdateScriptError,
	event: EventError,

	// State errors.
	question: QuestionError,
}

export function ErrorPage({ simulation, error, reset }) {
	// Determine if the current user owns the simulation. This means more info can be shown.
	const isOwner = useIsOwner(simulation)

	// Find the right component to display.
	const Component = components[error.type]
	if (!Component)
		throw new Error(`Invalid simulation validation error: received an error of type "${error.type}" but this type has no known component yet to display the error properly.`)

	return <Page title={simulation.title || '[Simulationstitel fehlt]'} showLogo="right">
		{error.source === 'simulation' ? <StandardSimulationErrorMessage {...{ reset }} /> : <StandardStateErrorMessage {...{ reset }} />}
		{isOwner ? <Alert severity="error" sx={{ my: 2 }}>
			<h5 style={{ margin: '0.25rem 0' }}>Informationen für Simulationsentwickler</h5>
			<Component simulation={simulation} error={error} />
		</Alert> : null}
	</Page>
}

function StandardSimulationErrorMessage() {
	return <Alert severity="warning" sx={{ my: 2 }}>
		<h5 style={{ margin: '0.25rem 0' }}>Inkonsistenz in der Simulation</h5>
		<p>Derzeit gibt es eine Inkonsistenz in den Simulationseinstellungen. Dies bedeutet in der Regel, dass der Ersteller einige Änderungen vornimmt und die Dinge derzeit nicht zusammenpassen. Bitte warten Sie ein wenig, bis die Simulation wieder funktioniert. (Sie brauchen nicht zu aktualisieren: Sie erscheint, wenn sie fertig ist.)</p>
	</Alert>
}

function StandardStateErrorMessage({ reset }) {
	const isOwner = useIsOwner()
	return <Alert severity="warning" sx={{ my: 2 }}>
		<h5 style={{ margin: '0.25rem 0' }}>Veralteter Simulationsstand</h5>
		<p>Wir haben versucht, Ihre Simulationsdaten zu laden und dort fortzufahren, wo Sie waren, aber das war nicht möglich. Es scheint, dass sich die Simulation seit Ihrem letzten Besuch erheblich verändert hat. Sie werden die Simulation neu starten müssen.</p>
		<Button variant="contained" onClick={() => reset(isOwner)}>Simulation neu starten</Button>
	</Alert>
}

function VariableError({ error }) {
	const { variable } = error
	const message = getVariableErrorMessage(error)
	return <p>Es gibt einen Fehler in der Definition des Parameters <em>{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}</em>. {message}</p>
}

function UpdateScriptError({ error }) {
	// Determine in which update script the error took place.
	let source
	const { question, questionIndex, option, optionIndex, error: errorObj } = error
	switch (error.subtype) {
		case 'general':
			source = <>Es gibt einen Fehler im allgemeinen Update-Skript, das nach jeder Seite ausgeführt wird.</>
			break
		case 'question':
			source = <>Es gibt einen Fehler im standard Update-Skript von Seite <em>{questionIndex + 1}. {question.title || emptyQuestion}</em>.</>
			break
		case 'option':
			source = <>Es gibt einen Fehler im Update-Skript von Seite <em>{questionIndex + 1}. {question.title || emptyQuestion}</em>, Antwortmöglichkeit <em>{numberToLetter(optionIndex).toUpperCase()}. {option.description.split('\n')[0] || emptyOption}</em>.</>
			break
		default:
			throw new Error(`Invalid update-script error subtype. Received an error for an update script with subtype "${error.subtype}" but could not process this properly.`)
	}

	// Set up the error message.
	return <>
		<p>{source}</p>
		<p>Der Fehler lautet: <em>{errorObj.message}</em></p>
	</>
}

function EventError({ error }) {
	const { event, error: errorObj } = error
	return <>
		<p>Es gibt einen Fehler in der Bedingung des Ereignisses <em>{event.title || emptyEventTitle}</em>.</p>
		<p>Der Fehler lautet: <em>{errorObj.message}</em></p>
	</>
}

function QuestionError() {
	return <p>Die Seite, bei der Sie waren, scheint aus der Simulation entfernt worden zu sein. Sie können bei einer unbekannten Seite nicht fortfahren.</p>
}
