import { evaluateExpression } from './scripts'

// getVariables obtains the current variables from a state.
export function getVariables(state) {
	return state.variablesAfter || state.variablesBefore
}

// getInitialVariables receives a simulation and sets up the initial value of variables.
export function getInitialVariables(simulation) {
	const result = {}
	Object.values(simulation.variables).forEach(variable => {
		result[variable.id] = getVariableInitialValue(variable, simulation)
	})
	return result
}

// getVariableInitialValue gets the initial value of a variable. When given some kind of script value, it tries to interpret it.
export function getVariableInitialValue(variable = {}, simulation) {
	return variable.initialValue && evaluateExpression(variable.initialValue, undefined, simulation.supportingFunctions)
}

// switchVariableNames takes an object with variables and switches the keys. For instance, it may be of the form { [id1]: 3, [id2]: 5 } and switches it to { x: 3, y: 5 } or vice versa. By default it goes from IDs to names, but this can be reversed by adding true as third parameter. If a simulation variable is missing, it'll be added automatically through its initial value.
export function switchVariableNames(variables = {}, simulation, toIds = false) {
	const result = {}
	Object.values(simulation.variables).forEach(variable => {
		const value = variables[variable[toIds ? 'name' : 'id']]
		result[variable[toIds ? 'id' : 'name']] = (value === undefined ? getVariableInitialValue(variable, simulation) : value)
	})
	return result
}

// getVariableDefinitionScript takes an object with variables like { a: 1, b: 2} and turns it into Javascript code defining these variables, like `let a = 1\nlet b = 2\n`. It always ends with a new-line too.
export function getVariableDefinitionScript(variables) {
	let result = ''
	Object.keys(variables).forEach(name => {
		result += `let ${name} = ${JSON.stringify(variables[name])};\n`
	})
	return result
}

// getExtractVariablesScript sets up Javascript code to merge all given variables into an object and return it. It takes an array of variable names and puts these all into an object.
export function getExtractVariablesScript(variableNames) {
	return `return {${variableNames.join(', ')}};\n`
}
