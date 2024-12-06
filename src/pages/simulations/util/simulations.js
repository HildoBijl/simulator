import { arrayFind } from 'util'

import { switchVariableNames } from './variables'
import { evaluateExpression } from './scripts'

// hasVariables checks if a simulation has variables.
export function hasVariables(simulation) {
	return simulation?.variables && Object.keys(simulation.variables).length > 0
}

// hasScripts checks if the simulation as an update script anywhere.
export function hasScripts(simulation) {
	if (simulation.updateScript)
		return true
	return simulation.pageList.some(page => {
		if (page.entryScript || page.updateScript)
			return true
		return (page.options || []).some(options => !!options.updateScript)
	})
}

// getState takes a simulation history object and extracts the state from it.
export function getState(history) {
	return history[history.length - 1]
}

// getFollowUpPage gets the follow-up page for the page specified in the given state. To determine it, it checks the options, the page follow-up, and applies defaults appropriately. 
export function getFollowUpPage(simulation, state) {
	// Extract the state data.
	const { pageId, choice, variablesBefore, variablesAfter } = state
	const page = simulation.pages[pageId]
	const variables = variablesAfter || variablesBefore || {}
	const variablesAsNames = switchVariableNames(variables, simulation)

	// When a choice has been made, check the option.
	const option = (page.options || [])[choice]
	if (option) {
		const followUpPage = findFollowUpPage(simulation, variablesAsNames, option)
		if (followUpPage)
			return followUpPage
	}

	// When no choice has been made, or the choice is not clear, apply page defaults.
	const followUpPage = findFollowUpPage(simulation, variablesAsNames, page)
	if (followUpPage)
		return followUpPage

	// Nothing is specified. Apply defaults: either the next page, or otherwise the end.
	const nextInList = simulation.pageList[simulation.pageList.findIndex(currPage => currPage.id === page.id) + 1]?.id
	return nextInList || 'end'
}

// findFollowUpPage takes an object (like a page or option) that has a followUpPage and potentially a followUpConditions parameter. It extracts the follow-up page accordingly.
export function findFollowUpPage(simulation, variables, object = {}) {
	const { followUpPage, followUpConditions } = object
	if (followUpPage === 'conditional')
		return findFollowUpPageFromConditions(simulation, variables, followUpConditions)
	return followUpPage
}

// findFollowUpPageFromConditions takes a list of conditions of the form [{condition: 'x < 0', page: 'someId'}, { ... }, 'fallbackPageId']. It finds the first condition that evaluates to true and returns the corresponding pageId. An undefined condition always defaults to false. The fallback is a string which always defaults to a true condition.
export function findFollowUpPageFromConditions(simulation, variables, conditions = []) {
	// Walk through the conditions to find one that turns out to be true.
	const result = arrayFind(conditions, item => {
		// Check basic cases.
		if (!item)
			return // Ignore empty items.
		if (typeof item === 'string')
			return item // Strings are seen as always having a true condition.

		// Check the condition.
		const { condition, page } = item
		try {
			const conditionHolds = evaluateExpression(condition, variables, simulation.supportingFunctions)
			return conditionHolds ? (page || 'default') : undefined
		} catch (error) {
			return 'error'
		}
	})?.value

	// We used 'default' as a placeholder, where it's normally undefined. Revert back.
	return result === 'default' ? undefined : result
}
