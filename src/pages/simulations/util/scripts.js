import { parseScript } from 'esprima'

import { lastOf, getBracketPositions, getError } from 'util'

import { hasVariables } from './simulations'
import { getInitialVariables, switchVariableNames, getVariableDefinitionScript, getExtractVariablesScript } from './variables'

// The defaultFunctions are the functions that are included whenever custom script is run.
export const defaultFunctions = `
function rand(min, max) { return min + (max-min)*Math.random() }
function randInt(min, max) { return Math.round(rand(min-0.5, max+0.5)) }
function roundTo(number, decimals = 0) { return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals) }
function roundToDigits(number, digits) { return number === 0 ? 0 : digits === 0 ? 0 : digits === Infinity ? number : roundTo(number, digits - Math.floor(Math.log10(Math.abs(number))) - 1) }
`

// runScript runs a given script and returns the resulting value. It works just like the eval-function, but it adds a separate scope, making it safer. A clear return has to be included to return anything though. So end with something like `return x` to return a value.
export function runScript(script) {
	return eval(`(function() {
		${script}
	})()`)
}

// runUpdateScript takes an update script and a set of variables runs the update script, returning the updated variables. Note: the variables must be name-based, so of the form { x: 3, y: 5 }.
export function runUpdateScript(script, variables, supportingFunctions = '') {
	if (!script)
		return variables
	return runScript(`
		${defaultFunctions}
		${supportingFunctions}
		${variables ? getVariableDefinitionScript(variables) : ''}
		${script}\n
		${getExtractVariablesScript(Object.keys(variables))}`
	)
}

// evaluateExpression takes a Javascript expression and a set of variables and evaluates the expression, returning the result. Note: the variables must be name-based, so of the form { x: 3, y: 5 }.
export function evaluateExpression(expression, variables, supportingFunctions = '') {
	if (!expression)
		return undefined // No condition given? Then it is undefined.
	return runScript(`
		${defaultFunctions}
		${supportingFunctions}
		${variables ? getVariableDefinitionScript(variables) : ''}
		return ${expression}\n
	`)
}

// runSimulationUpdateScript takes a simulation and runs a given update script for that simulation. Variables should be ID-based, since the simulation knows about the IDs. The updateScript given can be an array too, in which case they are run sequentially.
export function runSimulationUpdateScript(updateScripts, variables, simulation) {
	// Ensure we have an array of update scripts.
	if (!Array.isArray(updateScripts))
		updateScripts = [updateScripts]

	// Set the variables to a name-basis, run the scripts, and set them back.
	let variablesAsNames = switchVariableNames(variables, simulation)
	updateScripts.forEach(updateScript => {
		variablesAsNames = runUpdateScript(updateScript, variablesAsNames, simulation.supportingFunctions)
	})
	return switchVariableNames(variablesAsNames, simulation, true)
}

// resolveScripts takes a text (possibly with HTML) and resolves any scripts defined within curly braces { ... }.
export function resolveScripts(text, variables, simulation) {
	if (!hasVariables(simulation))
		return text
	if (!text)
		return text

	// Get the bracket positions. If they are not properly nested, or simply have no brackets, just return the text.
	const bracketPositions = getBracketPositions(text)
	if (!bracketPositions)
		return text // Not properly nested.
	if (bracketPositions.length === 0)
		return text // No brackets.

	// Walk through the bracket positions to assemble the text.
	let result = ''
	const variablesAsNames = switchVariableNames(variables, simulation)
	bracketPositions.forEach((bracketSet, index) => {
		// Add the part prior to the opening bracket.
		result += text.substring(index === 0 ? 0 : bracketPositions[index - 1][1] + 1, bracketSet[0])
		let expression = text.substring(bracketSet[0] + 1, bracketSet[1])

		// If there are HTML tags inside the expression, then throw them out. Stuff on the edges is still incorporated into the result though. So for <strong>a<br/>x</strong> we keep the strongs but throw out the break to evaluate "ax". Also turn &gt; and similar back into ">".
		let outsideTags = getOutsideTags(expression)
		result += outsideTags.before
		expression = clearTags(outsideTags.inner)
		expression = preprocessScript(expression)

		// Try to get the expression evaluation. As fallback show dots.
		let evaluated
		try {
			evaluated = evaluateExpression(expression, variablesAsNames, simulation.supportingFunctions)
			if (evaluated === undefined || evaluated === null)
				evaluated = '...'
		} catch (error) {
			evaluated = '...'
		}
		result += evaluated
		result += outsideTags.after
	})
	result += text.substring(lastOf(bracketPositions)[1] + 1)
	return result
}

// preprocessScript takes a user-defined script and preprocesses it.
export function preprocessScript(script) {
	// Turn < or > tags from TinyMCE back into comparisons.
	script = script.replace(/&lt;/g, '<')
	script = script.replace(/&gt;/g, '>')
	script = script.replace(/&amp;/g, '&')

	// All done!
	return script
}

// getOutside takes a piece of text like "<strong>something</strong>" or "end of line<br/>" and returns an object of the form { left: '<strong>', inner: 'something', right: '</strong>' } or similarly { left: '', inner: 'end of line', right: '<br/>' }. It does so recursively: on multiple tags on the outside, it bundles them together. It returns undefined when there is no HTML tag on the outer end of the string.
function getOutsideTags(text) {
	// Check for tags at the start.
	const matchBefore = text.match(/^((<\/?[a-zA-Z -="]+\/?>)*)/)
	const before = matchBefore[1]

	// Check for tags at the end.
	const matchAfter = text.match(/((<\/?[a-zA-Z -="]+\/?>)*)$/)
	const after = matchAfter[1]

	// Gather the remaining text.
	const inner = after.length === 0 ? text.slice(before.length) : text.slice(before.length, -after.length)
	return { before, inner, after }
}

// clearTags deletes all HMTL tags inside a piece of text.
export function clearTags(text) {
	return text.replace(/<\/?[a-zA-Z -="]+\/?>/g, '')
}

// getScriptError takes a script and, for a given simulation, evaluates its functioning. On an error it returns it. When everything is OK, undefined is returned.
export function getScriptError(script, simulation) {
	// Check the input.
	if (simulation === undefined)
		throw new Error(`Invalid getScriptError parameters: a simulation also has to be passed for the function to be able to evaluate an update script.`)
	if (script === undefined)
		return // No script is OK.

	return getError(() => {
		// Check for compile errors.
		parseScript(script)

		// Check for run-time errors, using the initial variables.
		const initialVariables = switchVariableNames(getInitialVariables(simulation), simulation)
		runUpdateScript(script, initialVariables, simulation.supportingFunctions)
	})
}

// getExpressionError takes an expression and, for a given simulation, evaluates its functioning. On an error it returns it. When everything is OK, undefined is returned.
export function getExpressionError(expression, simulation, { allowUndefined = false, requireBoolean = false, requireNumber = false } = {}) {
	// Check the input.
	if (simulation === undefined)
		throw new Error(`Invalid getScriptError parameters: a simulation also has to be passed for the function to be able to evaluate an update script.`)
	if (expression === undefined)
		return // No script is OK.

	return getError(() => {
		// Check for compile errors. Wrap the expression inside brackets to prevent confusion on an input object like "{x:2,y:5}".
		const parseError = getError(() => parseScript(`(${expression})`)) && getError(() => parseScript(expression))
		if (parseError)
			throw parseError

		// Check for run-time errors, using the initial variables.
		const initialVariables = switchVariableNames(getInitialVariables(simulation), simulation)
		const result = evaluateExpression(expression, initialVariables, simulation.supportingFunctions)

		// Ensure that we received a boolean.
		if (requireBoolean && typeof result !== 'boolean')
			throw new Error(`Die Bedingung gibt weder true noch false zurück.`)
		if (requireNumber && !(typeof result === 'number' || (typeof result === 'string' && !isNaN(result))))
			throw new Error(`Der Wert ergibt keine Zahl.`)
		if (!allowUndefined && (result === undefined || result === null))
			throw new Error(`Der Ausdruck hat keinen richtigen Wert zurückgegeben.`)
	})
}
