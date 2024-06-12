import { arrayFind } from 'util'

import { hasVariables, getScriptError, getConditionError } from './util'

// isSimulationValid checks if the given simulation has any problems. It returns a boolean.
export function isSimulationValid(simulation) {
	return !getSimulationError(simulation)
}

// canSimulationHaveErrors checks if a simulation can even have errors. If it's very basic, it does not.
export function canSimulationHaveErrors(simulation) {
	// When no simulation is given, it cannot have errors.
	if (!simulation)
		return false

	// A simulation without variables is always OK. The basic simulation functionalities never have inconsistencies.
	if (!hasVariables(simulation))
		return false

	// There is a potential for an error.
	return true
}

// getGeneralSimulationError looks for any error in the simulation that is generally a problem. (Like faulty variables.) It does not check for errors that are specific to certain situations (like update scripts to specific questions or question options). On no errors it gives undefined.
export function getGeneralSimulationError(simulation) {
	// When the simulation can't have errors, don't run checks: return undefined immediately.
	if (!canSimulationHaveErrors(simulation))
		return

	// Check for faulty variables.
	const faultyVariable = getFaultyVariable(simulation)
	if (faultyVariable)
		return faultyVariable
}

// getSimulationError looks for any potential error in a simulation. If there are any, it returns the first error found. Otherwise it gives undefined.
export function getSimulationError(simulation) {
	// Don't run checks if there can be no errors.
	if (!canSimulationHaveErrors(simulation))
		return

	// Run general checks.
	const generalError = getGeneralSimulationError(simulation)
	if (generalError)
		return generalError

	// Check all update scripts.
	const updateScriptError = getSimulationUpdateScriptError(simulation)
	if (updateScriptError)
		return updateScriptError

	// Check the conditions for events.
	const eventError = getSimulationEventError(simulation)
	if (eventError)
		return eventError
}

export function getFaultyVariable(simulation) {
	const { variables } = simulation
	const faultyVariable = arrayFind(Object.values(variables), variable => getVariableError(variable, variables))
	return faultyVariable?.value
}

export function getVariableError(variable, variables) {
	// Set up an error builder.
	const buildError = (subtype) => ({ variable, type: 'variable', subtype })

	// Check for a duplicate name.
	if (Object.values(variables).find(otherVariable => otherVariable.id !== variable.id && otherVariable.name === variable.name))
		return buildError('duplicateName')

	// Check for value issues.
	const { initialValue, min, max } = variable
	if (min !== undefined && max !== undefined && min > max)
		return buildError('minAboveMax')
	if (initialValue !== undefined && min !== undefined && initialValue < min)
		return buildError('initialBelowMin')
	if (initialValue !== undefined && max !== undefined && initialValue > max)
		return buildError('initialAboveMax')
}

export function getVariableErrorMessage(error) {
	const { subtype } = error
	return {
		'duplicateName': 'Der Name dieses Parameters ist gleich einem anderen Parameter.',
		'minAboveMax': 'Das Minimum darf nicht größer sein als das Maximum.',
		'initialBelowMin': 'Der Anfangswert darf nicht kleiner als das Minimum sein.',
		'initialAboveMax': 'Der Anfangswert darf nicht größer als das Maximum sein.',
	}[subtype]
}

// getSimulationUpdateScriptError checks for a given simulation whether all update scripts are OK. If so, undefined is given. If not, an error is returned.
export function getSimulationUpdateScriptError(simulation) {
	// Check the general update script.
	const generalError = getScriptError(simulation.updateScript, simulation)
	if (generalError)
		return { source: 'simulation', type: 'updateScript', subtype: 'general', error: generalError }

	// Check the question update scripts, both the main scripts and the ones per option.
	const questionErrorObj = arrayFind(Object.values(simulation.questions), question => {
		// Check the question update script.
		const questionIndex = simulation.questionList.indexOf(question)
		const questionError = getScriptError(question.updateScript, simulation)
		if (questionError)
			return { source: 'simulation', type: 'updateScript', subtype: 'question', error: questionError, question, questionIndex }

		// Check the options update scripts.
		if (question.options) {
			const optionErrorObj = arrayFind(question.options, (option, optionIndex) => {
				const optionError = getScriptError(option.updateScript, simulation)
				if (optionError)
					return { source: 'simulation', type: 'updateScript', subtype: 'option', error: optionError, question, questionIndex, option, optionIndex }
			})
			if (optionErrorObj)
				return optionErrorObj.value
		}
	})
	if (questionErrorObj)
		return questionErrorObj.value
}

// getSimulationEventError checks for a given simulation whether the events are OK. If so, undefined is returned. If not, an error is given.
export function getSimulationEventError(simulation) {
	const eventErrorObj = arrayFind(Object.values(simulation.events), (event, eventIndex) => {
		const conditionError = getConditionError(event.condition, simulation)
		if (conditionError)
			return { source: 'simulation', type: 'event', subtype: 'condition', error: conditionError, event, eventIndex }
	})
	if (eventErrorObj)
		return eventErrorObj.value
}

// getStateError checks, for a given simulation, whether the state is still OK. Stuff like missing variables can be fixed on-the-go, but a questionId that is not known is a fatal error.
export function getStateError(simulation, state) {
	// Check that the question ID from the state exists. (If there is no questionId, then the simulation hasn't started yet; that's fine too.)
	if (state.questionId && !simulation.questions[state.questionId])
		return { source: 'state', type: 'question', subtype: 'missing' }
}
