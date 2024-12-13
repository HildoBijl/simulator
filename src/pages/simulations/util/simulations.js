import { arrayFind, lastOf, isBasicObject } from 'util'

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
	// Get the conditions.
	const conditions = getFollowUpConditions(simulation, state)

	// Evaluate the conditions using the current variables.
	const variables = state.variablesAfter || state.variablesBefore || {}
	return findFollowUpPageFromConditions(simulation, switchVariableNames(variables, simulation), conditions)
}

// getFollowUpCondition gets the follow-up page for the page specified in the given state, but it only returns the list conditions and does not evaluate them yet.
export function getFollowUpConditions(simulation, state) {
	// Extract the state data.
	const { pageId, choice } = state
	const page = simulation.pages[pageId]

	// First check for potential events that need to be jumped back from.
	if (state.jumpPage)
		return state.jumpPage // The conditions are already stored.

	// When a choice has been made, check the option.
	const option = (page.options || [])[choice]
	if (option) {
		const followUpPage = extractFollowUpConditions(option)
		if (followUpPage)
			return followUpPage
	}

	// When no choice has been made (or the option refers to defaults) then apply page defaults.
	const followUpPage = extractFollowUpConditions(page)
	if (followUpPage)
		return followUpPage

	// Nothing is specified. Apply defaults: either the next page, or otherwise the end.
	const nextInList = simulation.pageList[simulation.pageList.findIndex(currPage => currPage.id === page.id) + 1]?.id
	return nextInList || 'end'
}

// extractFollowUpConditions takes an object (like a page or option) that has a followUpPage and potentially a followUpConditions parameter. It extracts the follow-up page accordingly.
export function extractFollowUpConditions(object = {}) {
	const { followUpPage, followUpConditions } = object
	return (followUpPage === 'conditional') ? followUpConditions : followUpPage
}

// findFollowUpPageFromConditions takes a list of conditions of the form [{condition: 'x < 0', page: 'someId'}, { ... }, 'fallbackPageId']. It finds the first condition that evaluates to true and returns the corresponding pageId. An undefined condition always defaults to false. The fallback is a string which always defaults to a true condition.
export function findFollowUpPageFromConditions(simulation, variables, conditions = []) {
	// Check a string case.
	if (typeof conditions === 'string')
		return conditions

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

export function doesOptionUseDefaultFollowUp(option) {
	if (!option.followUpPage)
		return true // An undefined follow-up page: this is hence the default.
	if (option.followUpPage !== 'conditional')
		return false // A specifically defined follow-up page.
	const followUpConditions = option.followUpConditions || []
	if (followUpConditions.some(condition => isBasicObject(condition) && condition.page === undefined))
		return true // Some condition has the default follow-up.
	return typeof lastOf(followUpConditions) !== 'string' // The last entry (the back-up) is undefined. So the fallback is the default.
}
