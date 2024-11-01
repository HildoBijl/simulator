
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

// getVariables obtains the current variables from a state.
export function getVariables(state) {
	return state.variablesAfter || state.variablesBefore
}

// getFollowUpPage gets the follow-up page for a given simulation page. If it's set, give the setting. If not, give the ID of the next page. If not available, end the simulation.
export function getFollowUpPage(page, simulation) {
	return page.followUpPage || simulation.pageList[simulation.pageList.findIndex(currPage => currPage.id === page.id) + 1]?.id || 'end'
}

// getInitialVariables receives a simulation and sets up the initial value of variables.
export function getInitialVariables(simulation) {
	const result = {}
	Object.values(simulation.variables).forEach(variable => {
		result[variable.id] = getVariableInitialValue(variable)
	})
	return result
}

// getVariableInitialValue gets the initial value of a variable. If it's defined, that is returned. If not, it is derived from the minimum and maximum.
export function getVariableInitialValue(variable = {}) {
	const { initialValue, min, max } = variable
	if (initialValue !== undefined)
		return initialValue
	if (min !== undefined) {
		if (max !== undefined)
			return (min + max) / 2
		return min
	} else {
		if (max !== undefined)
			return max
		return 0
	}
}

// boundVariables takes a set of variable values (defined through their names, like { x: -5, y: 120 }, unless useId is set to true) and a set of variables definitions, and bounds the given variable values to their defined bounds, if present.
export function boundVariables(variableValues, variables, useId = false) {
	const result = {}
	const key = useId ? 'id' : 'name'
	Object.values(variables).forEach(variable => {
		const newValue = boundVariable(variableValues[variable[key]], variable)
		if (newValue !== undefined)
			result[variable[key]] = newValue
	})
	return result
}

// boundVariable takes a variable value and a variable setting and applies the given bounds.
export function boundVariable(value, variable) {
	if (value === undefined)
		return
	value = (variable.min === undefined ? value : Math.max(value, variable.min))
	value = (variable.max === undefined ? value : Math.min(value, variable.max))
	return value
}
