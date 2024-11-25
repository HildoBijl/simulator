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

// getFollowUpPage gets the follow-up page for a given simulation page. If it's set, give the setting. If not, give the ID of the next page. If not available, end the simulation.
export function getFollowUpPage(page, simulation, choice) {
	// When no choice is given, go for the page default.
	if (choice === undefined) {
		if (page.followUpPage)
			return page.followUpPage
		const nextInList = simulation.pageList[simulation.pageList.findIndex(currPage => currPage.id === page.id) + 1]?.id
		return nextInList || 'end'
	}

	// When a choice is given, check the option, and otherwise go for the page default.
	const option = (page.options || [])[choice]
	return option?.followUpPage || getFollowUpPage(page, simulation)
}
