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

// getGeneralSimulationError looks for any error in the simulation that is generally a problem. (Like faulty variables.) It does not check for errors that are specific to certain situations (like entry/update scripts to specific pages or page options). On no errors it gives undefined.
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

	// Check all entry scripts.
	const entryScriptError = getSimulationEntryScriptError(simulation)
	if (entryScriptError)
		return entryScriptError

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

// getSimulationEntryScriptError checks for a given simulation whether all entry scripts are OK. If so, undefined is given. If not, an error is returned.
export function getSimulationEntryScriptError(simulation) {
	// Walk through all pages to check their entry scripts.
	const pageErrorObj = arrayFind(Object.values(simulation.pages), page => {
		// Check the page update script.
		const pageError = getScriptError(page.entrySript, simulation)
		if (pageError)
			return { source: 'simulation', type: 'entryScript', subtype: 'page', error: pageError, page }
	})
	if (pageErrorObj)
		return pageErrorObj.value
}

// getSimulationUpdateScriptError checks for a given simulation whether all update scripts are OK. If so, undefined is given. If not, an error is returned.
export function getSimulationUpdateScriptError(simulation) {
	// Check the general update script.
	const generalError = getScriptError(simulation.updateScript, simulation)
	if (generalError)
		return { source: 'simulation', type: 'updateScript', subtype: 'general', error: generalError }

	// Check the page update scripts, both the main scripts and the ones per option.
	const pageErrorObj = arrayFind(Object.values(simulation.pages), page => {
		// Check the page update script.
		const pageError = getScriptError(page.updateScript, simulation)
		if (pageError)
			return { source: 'simulation', type: 'updateScript', subtype: 'page', error: pageError, page }

		// Check the options update scripts.
		if (page.options) {
			const optionErrorObj = arrayFind(page.options, (option, optionIndex) => {
				const optionError = getScriptError(option.updateScript, simulation)
				if (optionError)
					return { source: 'simulation', type: 'updateScript', subtype: 'option', error: optionError, page, option, optionIndex }
			})
			if (optionErrorObj)
				return optionErrorObj.value
		}
	})
	if (pageErrorObj)
		return pageErrorObj.value
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

// getStateError checks, for a given simulation, whether the state is still OK. Stuff like missing variables can be fixed on-the-go, but a pageId that is not known is a fatal error.
export function getStateError(simulation, state) {
	// When there is no state yet, then there cannot be erroneous data in the state. No error.
	if (!state)
		return undefined

	// Check that the pageId from the state exists. (If there is no pageId, then the simulation hasn't started yet; that's fine too.)
	if (state.pageId !== 'end' && !simulation.pages[state.pageId])
		return { source: 'state', type: 'page', subtype: 'missing' }
}
