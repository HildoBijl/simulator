import { parseScript } from 'esprima'

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

// getInitialVariables receives a simulation and sets up the initial value of variables.
export function getInitialVariables(simulation) {
	const result = {}
	Object.values(simulation.variables).forEach(variable => {
		result[variable.id] = getVariableInitialValue(variable)
	})
	return result
}

// switchVariableNames takes an object with variables and switches the keys. For instance, it may be of the form { [id1]: 3, [id2]: 5 } and switches it to { x: 3, y: 5 } or vice versa. By default it goes from IDs to names, but this can be reversed by adding true as third parameter. If a simulation variable is missing, it'll be fixed automatically.
export function switchVariableNames(variables, simulation, toIds = false) {
	const result = {}
	Object.values(simulation.variables).forEach(variable => {
		const value = variables[variable[toIds ? 'name' : 'id']]
		result[variable[toIds ? 'id' : 'name']] = (value === undefined ? getVariableInitialValue(variable) : value)
	})
	return result
}

// runScript runs a given script and returns the resulting value. It works just like the eval-function, but it adds a separate scope, making it safer. A clear return has to be included to return anything though. So end with something like `return x` to return a value.
export function runScript(script) {
	return eval(`(function() {
		${script}
	})()`)
}

// getVariableDefinitionScript takes an object with variables like { a: 1, b: 2} and turns it into Javascript code defining these variables, like `let a = 1\nlet b = 2\n`. It always ends with a new-line too.
export function getVariableDefinitionScript(variables) {
	let result = ''
	Object.keys(variables).forEach(name => {
		result += `let ${name} = ${variables[name]}\n`
	})
	return result
}

// getExtractVariablesScript sets up Javascript code to merge all given variables into an object and return it. It takes an array of variable names and puts these all into an object.
export function getExtractVariablesScript(variableNames) {
	return `return {${variableNames.join(', ')}}\n`
}

// runUpdateScript takes a set of variables and an update script and runs the update script, returning the updated variables. Note: the variables must be name-based, so of the form { x: 3, y: 5 }.
export function runUpdateScript(variables, script) {
	if (!script)
		return variables
	return runScript(`
		${getVariableDefinitionScript(variables)}
		${script}\n
		${getExtractVariablesScript(Object.keys(variables))}`
	)
}

// getScriptError takes a script and, for a given simulation, evaluates its functioning. On an error it returns it. When everything is OK, undefined is returned.
export function getScriptError(script, simulation) {
	// Check the input.
	if (simulation === undefined)
		throw new Error(`Invalid getScriptError parameters: a simulation also has to be passed for the function to be able to evaluate an update script.`)

	try {
		// Check for compile errors.
		parseScript(script)

		// Check for run-time errors, using the initial variables.
		const initialVariables = switchVariableNames(getInitialVariables(simulation), simulation)
		runUpdateScript(initialVariables, script)

		// No error found, all in order.
		return undefined
	} catch (error) {
		return error // On a thrown error, return said error.
	}
}
