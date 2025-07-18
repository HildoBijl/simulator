import { arrayRemove, deleteField } from 'firebase/firestore'

import { insertIntoArray, moveArrayElement } from 'util'
import { getDocumentRef, updateDocument, deleteDocument, getCollection } from 'fb'

import { updateSimulation } from '../functions'
import { updateEvent } from '../events'

// getPageRef will create a reference to a potential new page.
export function getPageRef(simulationId) {
	return getDocumentRef(`simulations/${simulationId}/pages`)
}

// getPages gets all the pages for a simulation with a given simulationId.
export async function getPages(simulationId) {
	return await getCollection(`simulations/${simulationId}/pages`)
}

// updatePage will update certain values for a page with a given simulationId and pageId.
export async function updatePage(simulationId, pageId, data, setOnNonExistent) {
	return await updateDocument(`simulations/${simulationId}/pages`, pageId, data, setOnNonExistent)
}

// deletePage will remove a certain page from the database.
export async function deletePage(simulation, pageToRemove) {
	// Walk through the simulation pages and folders and remove any references to this page.
	await Promise.all(Object.values(simulation.pages || []).map(async page => {
		const update = {}

		// On a folder, remove the page from its contents.
		if (page.type === 'folder') {
			if ((page.contents || []).includes(pageToRemove.id))
				update.contents = arrayRemove(pageToRemove.id)
		}

		// On a page, remove any reference to the deleted page in follow-up pages.
		if (page.type === 'page') {
			// First check the page itself, both the follow-up page and any potential conditionals.
			if (page.followUpPage === pageToRemove.id)
				update.followUpPage = deleteField()
			if ((page.followUpConditions || []).some(item => item?.page === pageToRemove.id))
				update.followUpConditions = page.followUpConditions.filter(item => item?.page !== pageToRemove.id)

			// Then run the same checks for the options.
			if ((page.options || []).some(option => option.followUpPage === pageToRemove.id || (option.followUpConditions || []).some(item => item?.page === pageToRemove.id))) {
				update.options = page.options.map(option => {
					option = { ...option }
					if (option.followUpPage === pageToRemove.id)
						delete option.followUpPage
					if ((option.followUpConditions || []).some(item => item?.page === pageToRemove.id))
						option.followUpConditions = option.followUpConditions.filter(item => item?.page !== pageToRemove.id)
					return option
				})
			}
		}

		// Apply the update if needed.
		if (Object.keys(update).length > 0)
			await updatePage(simulation.id, page.id, update)
	}))

	// Walk through the simulation events to see if this page appears in any event jump. If so, remove the page reference.
	await Promise.all(!simulation.events ? [] : Object.values(simulation.events).map(async event => {
		if (event.page === pageToRemove.id)
			await updateEvent(simulation.id, event.id, { page: deleteField() })
	}))

	// Update the main simulation object.
	const update = {}
	if (simulation.pageOrder.includes(pageToRemove.id))
		update.pageOrder = arrayRemove(pageToRemove.id)

	if (simulation.startingPage === pageToRemove.id) {
		// Find a valid new starting page
		const remainingPages = (simulation.pageList || [])
			.filter(page => page.id !== pageToRemove.id && simulation.pages[page.id])

		update.startingPage = remainingPages.length > 0
			? remainingPages[0].id
			: deleteField(); // If no valid pages remain, remove the startingPage property
	}
	await updateSimulation(simulation.id, update)

	// Finally delete the page itself.
	return await deleteDocument(`simulations/${simulation.id}/pages`, pageToRemove.id)
}

// movePage will move a page for a given simulation from one folder to another.
export async function movePage(simulation, pageToMove, originFolder, destinationFolder, index) {
	const pageOrder = simulation.pageOrder || []
	const originContents = (originFolder?.contents || []).map(page => page.id)
	const destinationContents = (destinationFolder?.contents || []).map(page => page.id)

	// If the origin and the destination folder are the same, adjust only that folder.
	if (!originFolder && !destinationFolder)
		return await updateSimulation(simulation.id, { pageOrder: moveArrayElement(pageOrder, pageOrder.indexOf(pageToMove.id), index) })
	if (originFolder?.id === destinationFolder?.id)
		return await updatePage(simulation.id, originFolder.id, { contents: moveArrayElement(originContents, originContents.indexOf(pageToMove.id), index) })

	// Set up a promise for the removing.
	const removingPromise = originFolder ?
		updatePage(simulation.id, originFolder.id, { contents: originContents.filter(pageId => pageId !== pageToMove.id) }) :
		updateSimulation(simulation.id, { pageOrder: pageOrder.filter(pageId => pageId !== pageToMove.id) })

	// Set up a promise for the adding.
	const addingPromise = destinationFolder ?
		updatePage(simulation.id, destinationFolder.id, { contents: insertIntoArray(destinationContents, index, pageToMove.id) }) :
		updateSimulation(simulation.id, { pageOrder: insertIntoArray(pageOrder, index, pageToMove.id) })

	// Await both promises together.
	return await Promise.all([removingPromise, addingPromise])
}

// moveOption will switch the order of the options within a page.
export async function moveOption(simulation, page, from, to) {
	if (from === to)
		return
	return await updatePage(simulation.id, page.id, {
		options: moveArrayElement(page.options, from, to)
	})
}

// moveDial will switch the order of the dials within a simulation.
export async function moveDial(simulation, from, to) {
	if (from === to)
		return
	return await updateSimulation(simulation.id, {
		dials: moveArrayElement(simulation.dials, from, to)
	})
}
