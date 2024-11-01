import { parseScript } from 'esprima'

import { getInitialVariables, getVariableInitialValue, boundVariables } from './util'

// The defaultFunctions are the functions that are included whenever custom script is run.
export const defaultFunctions = `
function rand(min, max) { return min + (max-min)*Math.random() }
function randInt(min, max) { return Math.round(rand(min-0.5, max+0.5)) }
`

// runSimulationUpdateScript takes a simulation and runs a given update script for that simulation. Variables should be ID-based, since the simulation knows about the IDs. The updateScript given can be an array too, in which case they are run sequentially.
export function runSimulationUpdateScript(updateScripts, variables, simulation) {
	// Ensure we have an array of update scripts.
	if (!Array.isArray(updateScripts))
		updateScripts = [updateScripts]

	// Set the variables to a name-basis, run the scripts, and set them back.
	let variablesAsNames = switchVariableNames(variables, simulation)
	updateScripts.forEach(updateScript => {
		variablesAsNames = runUpdateScript(variablesAsNames, updateScript, simulation.supportingFunctions)
		variablesAsNames = boundVariables(variablesAsNames, simulation.variables)
	})
	return switchVariableNames(variablesAsNames, simulation, true)
}

// switchVariableNames takes an object with variables and switches the keys. For instance, it may be of the form { [id1]: 3, [id2]: 5 } and switches it to { x: 3, y: 5 } or vice versa. By default it goes from IDs to names, but this can be reversed by adding true as third parameter. If a simulation variable is missing, it'll be added automatically through its initial value.
export function switchVariableNames(variables = {}, simulation, toIds = false) {
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
export function runUpdateScript(variables, script, supportingFunctions = '') {
	if (!script)
		return variables
	return runScript(`
		${defaultFunctions}
		${supportingFunctions}
		${getVariableDefinitionScript(variables)}
		${script}\n
		${getExtractVariablesScript(Object.keys(variables))}`
	)
}

// evaluateExpression takes a set of variables and a Javascript expression and evaluates the expression, returning the result. Note: the variables must be name-based, so of the form { x: 3, y: 5 }.
export function evaluateExpression(expression, variables, supportingFunctions = '') {
	if (!expression)
		return undefined // No condition given? Then it is undefined.
	return runScript(`
		${defaultFunctions}
		${supportingFunctions}
		${getVariableDefinitionScript(variables)}
		return ${expression}\n
	`)
}

// resolveScripts takes a text (possibly with HTML) and resolves any scripts defined within curly braces { ... }.
export function resolveScripts(text, variables, simulation) {
	const variablesAsNames = switchVariableNames(variables, simulation)
	let brackets = getCurlyBracketPositions(text)
	while (brackets) {
		const before = text.substring(0, brackets[0])
		const expression = text.substring(brackets[0] + 1, brackets[1])
		const after = text.substring(brackets[1] + 1)

		// Evaluate the expression and merge it back in.
		let evaluated
		try {
			evaluated = evaluateExpression(expression, variablesAsNames, simulation.supportingFunctions)
		} catch (error) {
			evaluated = '...' // On an error use dots.
		}
		text = before + evaluated + after
		brackets = getCurlyBracketPositions(text, (before + evaluated).length)
	}
	return text
}

// getCurlyBracketPositions takes a string like ab{cd{ef}g}h and returns the position of the outer nested curly brackets (here [2, 10]) as an array. It returns undefined when there are no outer curly brackets, or the opening brackets doesn't get closed.
function getCurlyBracketPositions(text, startAt = 0) {
	let depth = 0
	let open, close
	for (let i = startAt; i < text.length && close === undefined; i++) {
		const char = text[i]
		if (char === '{') {
			if (open === undefined)
				open = i
			depth++
		} else if (char === '}') {
			depth--
			if (depth === 0)
				close = i
		}
	}

	// Return the outcome that has been obtained.
	if (open !== undefined && close !== undefined)
		return [open, close]
}

// getScriptError takes a script and, for a given simulation, evaluates its functioning. On an error it returns it. When everything is OK, undefined is returned.
export function getScriptError(script, simulation) {
	// Check the input.
	if (simulation === undefined)
		throw new Error(`Invalid getScriptError parameters: a simulation also has to be passed for the function to be able to evaluate an update script.`)
	if (script === undefined)
		return // No script is OK.

	try {
		// Check for compile errors.
		parseScript(script)

		// Check for run-time errors, using the initial variables.
		const initialVariables = switchVariableNames(getInitialVariables(simulation), simulation)
		runUpdateScript(initialVariables, script, simulation.supportingFunctions)

		// No error found, all in order.
		return undefined
	} catch (error) {
		return error // On a thrown error, return said error.
	}
}

// getConditionError takes a condition statement and, for a given simulation, evaluates its functioning. On an error it returns it. When everything is OK, undefined is returned.
export function getConditionError(condition, simulation) {
	// Check the input.
	if (simulation === undefined)
		throw new Error(`Invalid getScriptError parameters: a simulation also has to be passed for the function to be able to evaluate an update script.`)
	if (condition === undefined)
		return // No script is OK.

	try {
		// Check for compile errors.
		parseScript(condition)

		// Check for run-time errors, using the initial variables.
		const initialVariables = switchVariableNames(getInitialVariables(simulation), simulation)
		const result = evaluateExpression(condition, initialVariables, simulation.supportingFunctions)

		// Ensure that we received a boolean.
		if (typeof result !== 'boolean')
			throw new Error(`Die Bedingung gibt weder true noch false zurück.`)

		// No error found, all in order.
		return undefined
	} catch (error) {
		return error // On a thrown error, return said error.
	}
}
