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

// getFollowUpPage gets the follow-up page for the page specified in the given state. To determine it, it checks the options, the page follow-up, and applies default appropriately. 
export function getFollowUpPage(simulation, state) {
	// Extract he state data.
	const { pageId, choice, variablesBefore, variablesAfter } = state
	const page = simulation.pages[pageId]
	const variables = variablesAfter || variablesBefore || {}
	const variablesAsNames = switchVariableNames(variables, simulation)

	// When a choice has been made, check the option.
	const option = (page.options || [])[choice]
	if (option) {
		const followUpPage = findFollowUpPage(simulation, variablesAsNames, option.followUpPage)
		if (followUpPage)
			return followUpPage
	}

	// When no choice has been made, or the choice is not clear, apply page defaults.
	const followUpPage = findFollowUpPage(simulation, variablesAsNames, page.followUpPage)
	if (followUpPage)
		return followUpPage

	// Nothing is specified. Apply defaults: either the next page, or otherwise the end.
	const nextInList = simulation.pageList[simulation.pageList.findIndex(currPage => currPage.id === page.id) + 1]?.id
	return nextInList || 'end'
}

// findFollowUpPage takes an array of follow-up pages with conditions like [{condition: 'x < 0', page: 'someId'}, { ... }, 'fallbackPageId'] and finds the first follow-up page whose condition evaluates to true.
export function findFollowUpPage(simulation, variables, followUpPage) {
	// On undefined or a string, keep the given input.
	if (!followUpPage)
		return followUpPage
	if (typeof followUpPage === 'string')
		return followUpPage

	// On an array, find the first entry that is valid.
	if (Array.isArray(followUpPage))
		return arrayFind(followUpPage, item => findFollowUpPage(simulation, variables, item))?.value

	// On an object (the only remaining case) check if the condition holds.
	const { condition, page } = followUpPage
	const conditionHolds = evaluateExpression(condition, variables, simulation.supportingFunctions)
	return conditionHolds ? page : undefined
}
