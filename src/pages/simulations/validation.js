import { arrayFind, getBracketPositions } from 'util'

import { hasVariables } from './util'
import { getScriptError, getExpressionError, clearTags } from './scripts'

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

	// Check for faulty supporting functions.
	const supportingFunctionsError = getSupportingFunctionsError(simulation)
	if (supportingFunctionsError)
		return supportingFunctionsError
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

	// Check display-script errors.
	const displayScriptError = getDisplayScriptError(simulation)
	if (displayScriptError)
		return displayScriptError

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

// getSupportingFunctionsError checks for a given simulation whether the supporting functions are OK. If so, undefined is given. If not, an error is returned.
export function getSupportingFunctionsError(simulation) {
	if (simulation.supportingFunctions) {
		const error = getScriptError(simulation.supportingFunctions, { ...simulation, supportingFunctions: undefined })
		if (error)
			return { source: 'simulation', type: 'supportingFunctions', error }
	}
}

// getSimulationEntryScriptError checks for a given simulation whether all entry scripts are OK. If so, undefined is given. If not, an error is returned.
export function getSimulationEntryScriptError(simulation) {
	// Walk through all pages to check their entry scripts.
	const pageErrorObj = arrayFind(Object.values(simulation.pages), page => {
		// Check the page update script.
		const pageError = getScriptError(page.entryScript, simulation)
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

// getDisplayScriptError looks at all scripts inside simulation display texts, like "your life points are {hp}." It checks all these small code snippets to see if they return an appropriate value.
export function getDisplayScriptError(simulation) {
	// Check the header/footer.
	const headerError = evaluateTextWithScripts(simulation.pageHeader, simulation)
	if (headerError)
		return { source: 'simulation', type: 'displayScript', subtype: 'header', ...headerError }
	const footerError = evaluateTextWithScripts(simulation.pageFooter, simulation)
	if (footerError)
		return { source: 'simulation', type: 'displayScript', subtype: 'footer', ...footerError }

	// Walk through the pages.
	const pageErrorObj = arrayFind(Object.values(simulation.pages), page => {
		if (page.description) {
			const descriptionError = evaluateTextWithScripts(page.description, simulation)
			if (descriptionError)
				return { source: 'simulation', type: 'displayScript', subtype: 'page', field: 'description', page, ...descriptionError }
		}
		if (page.feedback) {
			const feedbackError = evaluateTextWithScripts(page.feedback, simulation)
			if (feedbackError)
				return { source: 'simulation', type: 'displayScript', subtype: 'page', field: 'feedback', page, ...feedbackError }
		}

		// Within the page, walk through the options.
		if (page.options) {
			const optionErrorObj = arrayFind(page.options, (option, optionIndex) => {
				if (option.description) {
					const descriptionError = evaluateTextWithScripts(option.description, simulation)
					if (descriptionError)
						return { source: 'simulation', type: 'displayScript', subtype: 'option', field: 'description', page, option, optionIndex, ...descriptionError }
				}
				if (option.feedback) {
					const feedbackError = evaluateTextWithScripts(option.feedback, simulation)
					if (feedbackError)
						return { source: 'simulation', type: 'displayScript', subtype: 'option', field: 'feedback', page, option, optionIndex, ...feedbackError }
				}
			})
			if (optionErrorObj)
				return optionErrorObj.value
		}
	})

	// Check if an error was found.
	if (pageErrorObj)
		return pageErrorObj.value
}

// evaluateTextWithScripts takes a piece of text, for instance a page description, and checks all display scripts in it. It returns an error object on an error.
export function evaluateTextWithScripts(text, simulation) {
	// No text cannot have any errors.
	if (!text)
		return

	// Get the bracket positions. If they are not properly nested, or simply have no brackets, just return the text.
	const bracketPositions = getBracketPositions(text)
	if (!bracketPositions)
		return { error: { type: 'noNestedBrackets', message: 'Die Klammern sind nicht richtig verschachtelt.' } } // Not properly nested.
	if (bracketPositions.length === 0)
		return // No brackets, so all OK.

	// Walk through the brackets to test all expressions.
	return arrayFind(bracketPositions, bracketSet => {
		let expression = text.substring(bracketSet[0] + 1, bracketSet[1])
		expression = clearTags(expression)
		const error = getExpressionError(expression, simulation)
		if (error)
			return { expression, error }
	})?.value
}

// getSimulationEventError checks for a given simulation whether the events are OK. If so, undefined is returned. If not, an error is given.
export function getSimulationEventError(simulation) {
	const eventErrorObj = arrayFind(Object.values(simulation.events || {}), (event, eventIndex) => {
		const conditionError = getExpressionError(event.condition, simulation, true)
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
	if (!simulation.pages[state.pageId])
		return { source: 'state', type: 'page', subtype: 'missing' }
}
