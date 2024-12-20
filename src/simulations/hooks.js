import { useMemo, useState, useEffect } from 'react'

import { arrayToObject } from 'util'
import { useUserData, useUserId, useDocument, useCollection } from 'fb'

import { getSimulationByUrl } from './functions'
import { useSimulationPages } from './pages'
import { useSimulationVariables } from './variables'
import { useSimulationEvents } from './events'

// useAllSimulationIds loads the IDs of ALL simulations that exist. This is generally not used in regular functioning of the app, but only when a manual change needs to be made to ALL simulations on for instance a database structure change.
export function useAllSimulationIds() {
	const simulations = useCollection('simulations')
	return useMemo(() => simulations ? Object.values(simulations).map(simulation => simulation.id) : [], [simulations])
}

// useSimulationIds gets all the simulation IDs for a specific user.
export function useSimulationIds() {
	const userData = useUserData()
	if (!userData)
		return undefined
	return userData.simulations || []
}

// useSimulationObject returns the raw simulation object from the database. It is not merged yet with other parameters, like the pages.
export function useSimulationObject(id, once = false) {
	return useDocument('simulations', id, once)
}

// useSimulation gets a simulation with a specific ID.
export function useSimulation(id, once = false) {
	// Load in all required data.
	const simulation = useSimulationObject(id, once)
	const rawPages = useSimulationPages(id, once)
	const variables = useSimulationVariables(id, once)
	const events = useSimulationEvents(id, once)

	// Assemble the data, depending on the loading status.
	return useMemo(() => {
		if (simulation === undefined || rawPages === undefined || variables === undefined)
			return undefined // Sign of loading.
		if (simulation && rawPages && variables) {
			const { pages, pageTree, pageList } = processPages(simulation.pageOrder, rawPages)
			return {
				...simulation,
				pages, pageTree, pageList,
				variables,
				events,
			}
		}
		return null // Sign of an error.
	}, [simulation, rawPages, variables, events])
}

// useSimulationIdFromUrl takes a simulation URL and returns an ID from it.
export function useSimulationIdFromUrl(url) {
	const [id, setId] = useState(url ? undefined : null)

	// Get the simulation ID from the database based on the URL.
	useEffect(() => {
		let active = true // To prevent state changes after dismount.
		if (url) {
			getSimulationByUrl(url).then(simulation => {
				if (active)
					setId(simulation?.id || null)
			})
		}
		return () => { active = false }
	}, [url])

	return id
}

// useIsOwner takes a simulation and checks if the given user is an owner.
export function useIsOwner(simulation) {
	const userId = useUserId()
	return simulation?.owners && simulation.owners.includes(userId)
}

// processPages gets the raw pages out of the database and adds useful utility info. It receives an array of pageIds to process, as well as a dictionary of raw pages.
function processPages(pageOrder = [], rawPages = {}, indices = []) {
	// Process all pages in the pageOrder to get a pageTree.
	const pageTree = pageOrder.map((pageId, index) => processPage(rawPages[pageId], rawPages, [...indices, index], undefined))

	// Flatten the tree. For now also include folders.
	const toArray = page => page.type === 'folder' ? [page, ...page.contents.map(page => toArray(page))] : page
	const pageListFull = pageTree.map(page => toArray(page)).flat(Infinity)
	const pages = arrayToObject(pageListFull, page => ({ key: page.id, value: page }))
	const pageList = pageListFull.filter(page => page.type === 'page') // Only keep actual pages.
	return { pageTree, pageList, pages }
}

// processPage takes a single (raw) page, possibly a folder with contents, and a list of (raw) pages. It processes the page, turning links to contents into actual links.
function processPage(page, pages, indices, parent) {
	// On a folder, recursively process subpages.
	if (page.type === 'folder') {
		const result = {
			...page,
			parent,
			index: indices,
		}
		result.contents = (page.contents || []).map((pageId, index) => processPage(pages[pageId], pages, [...indices, index], result))
		return result
	}

	// On a page run basic processing.
	if (page.type === 'page')
		return { ...page, index: indices, parent }

	// Check for impossible cases.
	throw new Error(`Invalid page type: received a page of type "${page.type}" but this type is not known.`)
}
