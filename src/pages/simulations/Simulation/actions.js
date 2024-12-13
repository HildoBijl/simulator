import { useCallback } from 'react'

import { selectRandomly, removeKeys } from 'util'
import { incrementSimulationField } from 'simulations'

import { defaultAfterwards, getState, hasVariables, getFollowUpPage, getFollowUpConditions, getInitialVariables, runSimulationUpdateScript, switchVariableNames, evaluateExpression, getScriptError, getGeneralSimulationError, getFaultyVariableError, getSimulationEventError, findFollowUpPageFromConditions } from '../util'

// useSimulationActions takes a simulation and a setHistory function, and returns a set of actions (functions) that can be called to adjust the simulation history. It also runs checks on the simulation on required parts (like when a specific update script is needed) and flips an error flag when something is not working properly.
export function useSimulationActions(simulation, setHistory, clearHistory, setError) {
	// reset will put the simulation back into its initial state with nothing defined.
	const reset = useCallback(() => {
		clearHistory()
	}, [clearHistory])

	// start will initialize the simulation, setting stuff like pages and variables to their (possibly partly randomized) initial values.
	const start = useCallback((devMode = false) => {
		// If there are general errors, no simulation can be started yet. Note this.
		if (getGeneralSimulationError(simulation))
			return setError(true)

		// Initialize the history by setting up the initial state.
		setHistory(history => {
			if (simulation.pageList.length === 0)
				throw new Error(`Cannot start simulation: it does not contain any pages yet. No first page can be defined.`)

			// When the simulation has already started, don't start it again.
			if (history && history.length > 0)
				return history

			// Determine the starting page.
			const pageId = simulation.startingPage || simulation.pageList[0]
			const startingPage = simulation.pages[pageId]
			const state = { pageId }

			// On variables, set them up.
			if (hasVariables(simulation)) {
				// Initialize the variables (after checking them).
				if (getFaultyVariableError(simulation)) {
					setError(true)
					return history
				}
				const initialVariables = getInitialVariables(simulation)

				// Run the entry script of the first page (after checking it).
				if (getScriptError(startingPage.entryScript, simulation)) {
					setError(true)
					return history
				}
				state.variablesBefore = runSimulationUpdateScript(startingPage.entryScript, initialVariables, simulation)
			}

			// Return the history as a single state.
			return [state]
		})

		// Update the statistics: first locally for the player and then in the database to show the owner.
		incrementPlayerPlayCounter(simulation)
		if (!devMode)
			incrementSimulationField(simulation.id, 'numPlayed')
	}, [simulation, setHistory, setError])

	// chooseOption will pick an option for the current page.
	const chooseOption = useCallback((index, devMode = false) => {
		// On any errors we cannot do anything.
		if (getGeneralSimulationError(simulation))
			return setError(true)

		// Update the state.
		setHistory(history => {
			// Check if an option input is possible.
			const state = getState(history)
			const { pageId, choice, variablesBefore } = state
			if (choice !== undefined)
				throw new Error(`Invalid option choice: an option has already been chosen.`)

			// Extract required data.
			const page = simulation.pages[pageId]
			const options = page.options || []

			// Check if the given option is valid.
			if (index !== undefined && (index < 0 || index >= options.length))
				throw new Error(`Invalid option choice: tried to choose option ${index} of a page, but the page only has ${options.length} options available. (Indices are zero-starting.)`)
			const option = options[index]

			// Set up the new state.
			const newState = {
				...state,
				choice: index,
			}

			// On variables, run all relevant update scripts.
			if (hasVariables(simulation)) {
				// Determine the update scripts to be run: first the one of the option (or page default) and then the general simulation update script.
				const updateScripts = [option.updateScript || page.updateScript, simulation.updateScript]

				// If any of the scripts has an error, note this and do not update.
				if (updateScripts.some(updateScript => getScriptError(updateScript, simulation))) {
					setError(true)
					return history
				}

				// Run the update scripts and store the new variables.
				newState.variablesAfter = runSimulationUpdateScript(updateScripts, variablesBefore, simulation)
			}

			// If this choice ends the simulation, update the numFinished counter.
			if (!devMode) {
				if (getFollowUpPage(simulation, state) === 'end')
					incrementSimulationField(simulation.id, 'numFinished')
			}

			// All done! Update the state in the history and return the new history.
			return [...history.slice(0, -1), newState]
		})
	}, [simulation, setHistory, setError])

	// goToNextPage will go to the next page depending on the (confirmed) selected page option.
	const goToNextPage = useCallback((devMode = false) => {
		setHistory(prevHistory => {
			// Extract the current state and its parameters.
			let history = prevHistory
			const state = getState(prevHistory)
			const { pageId, choice, variablesBefore, variablesAfter } = state
			const page = simulation.pages[pageId]

			// If the page has options, but no option has been selected and confirmed, we're not ready yet to move on.
			const options = page.options || []
			if (options.length > 0 && choice === undefined)
				throw new Error(`Invalid nextPage request: no option has been selected for the given state yet. Cannot go to the next page.`)

			// Determine the next page for the state. On an error, note this and don't change anything.
			const newState = {
				pageId: getFollowUpPage(simulation, state),
			}
			if (newState.pageId === 'error') {
				setError(true)
				return prevHistory
			}

			// On variables, we should also update the variables, check for events, etcetera.
			if (hasVariables(simulation)) {
				// When the page has no answer-options, still run the page update script (after checking it) since it hasn't been run yet.
				let variables
				if (options.length === 0) {
					if (getScriptError(page.updateScript, simulation)) {
						setError(true)
						return prevHistory
					}
					variables = runSimulationUpdateScript(page.updateScript, variablesBefore, simulation)
					history = [...history.slice(0, -1), { ...state, variablesAfter: variables }]
				} else {
					variables = variablesAfter
				}

				// Check all events for possible errors. If there are any, do not update.
				if (getSimulationEventError(simulation)) {
					setError(true)
					return prevHistory
				}

				// Copy necessary parameters into the new state.
				if (state.experiencedEvents)
					newState.experiencedEvents = state.experiencedEvents

				// Find all events that trigger (and that have not reached their maximum triggers). On multiple, select one randomly.
				const experiencedEvents = newState.experiencedEvents || {}
				const variablesAsNames = switchVariableNames(variables, simulation)
				const triggeredEvents = Object.values(simulation.events).filter(event => (experiencedEvents[event.id] || 0) < (event.maxTriggers === undefined ? Infinity : event.maxTriggers) && evaluateExpression(event.condition, variablesAsNames))
				console.log(triggeredEvents)
				if (triggeredEvents.length > 0) {
					const triggeredEvent = selectRandomly(triggeredEvents)

					// Make sure that afterwards we go to the right page.
					const afterwards = triggeredEvent.afterwards || defaultAfterwards
					if (afterwards === 'originalFollowUp') {
						newState.jumpPage = state.jumpPage || getFollowUpConditions(simulation, state) // Remember the page we jumped from. On subsequent events, remember the one that was already stored and not the event page.
					} else if (afterwards === 'eventFollowUp') {
						// Don't store any original jump-back.
					} else {
						throw new Error(`Invalid event-afterwards setting: have not implemented the setting "${afterwards}" yet.`)
					}

					// Apply the event into the state.
					newState.pageId = triggeredEvent.page || simulation.pageList[0] // Indicated or default, in case not set.
					newState.event = triggeredEvent.id // For history display purposes.
					newState.experiencedEvents = { ...experiencedEvents, [triggeredEvent.id]: (experiencedEvents[triggeredEvent.id] || 0) + 1 } // Track the number of times an event got executed.
				} else {
					// If we had an event and we need to jump back into the original sequence (a jumpedFromPage is defined) then do so. Determine the follow-up page based on the conditions and based on the current variables (possibly updated by the event).
					if (state.jumpPage) {
						newState.pageId = findFollowUpPageFromConditions(simulation, switchVariableNames(variables, simulation), state.jumpPage)
						if (newState.pageId === 'error') {
							setError(true)
							return prevHistory
						}
					}
				}

				// Upon entering the new page (if it exists, and is not the end) run its entry script (after checking it).
				const newPage = simulation.pages[newState.pageId]
				if (newPage) {
					if (getScriptError(newPage.entryScript, simulation)) {
						setError(true)
						return prevHistory
					}
					newState.variablesBefore = runSimulationUpdateScript(newPage.entryScript, variables, simulation)
				}
			}

			// If we are on a page with no options and an end-follow-up, update the numFinished counter.
			if (!devMode) {
				const newPage = simulation.pages[newState.pageId]
				if ((newPage.options || []).length === 0 && getFollowUpPage(simulation, newState) === 'end')
					incrementSimulationField(simulation.id, 'numFinished')
			}

			// The update is all done. Add the new state to the history.
			return [...history, newState]
		})
	}, [simulation, setHistory, setError])

	// jumpToPage is a function that allows to jump to any page. It's used for admin control. It hard-overwrites the pageId, either as the next page if a choice has been made, or as the current page if no choice has been made. It runs the entry script of the given page on jumping.
	const jumpToPage = useCallback((pageId) => {
		// Retrieve the page to be jumped to.
		const page = simulation.pages[pageId]

		// Update the history to jump to the new page.
		setHistory(history => {
			const state = getState(history)

			// When no choice has been made, overwrite the current page in the history.
			if (state.choice === undefined) {
				const newState = { ...state, pageId }

				// When there are variables, take them from the previous page (or the initial values if non-existing) and run the entry script on those.
				if (hasVariables(simulation)) {
					if (getScriptError(page.entryScript, simulation)) {
						setError(true)
						return history
					}
					const previousVariables = history[history.length - 2]?.variablesAfter || getInitialVariables(simulation)
					newState.variablesBefore = runSimulationUpdateScript(page.entryScript, previousVariables, simulation)
				}
				return [...history.slice(0, -1), newState]
			}

			// When a choice has been made, create a new state for this upcoming page.
			const newState = { pageId }
			if (hasVariables(simulation)) {
				// Copy necessary parameters into the new state.
				if (state.experiencedEvents)
					newState.experiencedEvents = state.experiencedEvents

				// Run the entry script of the page that's jumped to, to set the variables.
				newState.variablesBefore = runSimulationUpdateScript(page.entryScript, state.variablesAfter, simulation)
			}
			return [...history, newState]
		})
	}, [simulation, setHistory, setError])

	// undo will undo the last action that was taken. It pops off the last entry of the history, assuming there's more than one entry.
	const undo = useCallback(() => {
		setHistory(history => {
			if (history.length < 1 || (history.length === 1 && history[0].choice === undefined))
				throw new Error(`Invalid undo call: cannot undo the last action as no action was taken.`)

			// If there is no choice yet, jump to the previous state.
			let state = getState(history)
			if (state.choice === undefined)
				history = history.slice(0, -1)

			// If the state still has no choice defined, we jumped back to an info page. Keep it as is.
			state = history[history.length - 1]
			if (state.choice === undefined) {
				return history
			}

			// However, if the state does have a choice defined, remove it.
			const newState = removeKeys(state, ['choice', 'variablesAfter'])
			return [...history.slice(0, -1), newState]
		})
	}, [setHistory])

	// All actions are ready!
	return { reset, start, chooseOption, goToNextPage, jumpToPage, undo }
}

// incrementPlayerPlayCounter tracks on the user's LocalStorage how many times he/she played the given simulation. It increases the counter for the given simulation by one.
function incrementPlayerPlayCounter(simulation) {
	// Load the overview and ensure there's an object for the current simulation.
	const overview = JSON.parse(localStorage.getItem('simulationOverview') || '{}')
	if (!overview[simulation.id])
		overview[simulation.id] = {}

	// Increment the play counter and save it.
	overview[simulation.id].numPlayed = overview[simulation.id].numPlayed ? (overview[simulation.id].numPlayed + 1) : 1
	localStorage.setItem('simulationOverview', JSON.stringify(overview))
}
