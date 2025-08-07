import { isNumber, selectAttributes } from 'util'
import { getId } from 'fb'

import { rowShift } from './settings'
import { ProcessingError } from './checking'
import { readSheet, readSheetRequired } from './reading'
import { tabNames } from './settings'

// processWorkbook takes a workbook (we assume it's been checked for errors) and processes it to a more structured data format. It calls an inner function and, on a ProcessingError, simply returns said error instead of the processed workbook.
export function processWorkbook(workbook, simulation) {
	try {
		const processedWorkbook = processWorkbookInner(workbook, simulation)
		return { processedWorkbook }
	} catch (error) {
		if (error.type !== 'ProcessingError')
			throw error // On an unknown error, rethrow.
		return { error: error.data }
	}
}

// processWorkbookInner processes the workbook, which may throw a ProcessingError.
export function processWorkbookInner(workbook) {
	const folderData = processFolders(workbook)
	const pageData = processPages(workbook, folderData)
	const parameterData = processParameters(workbook)
	const eventData = processEvents(workbook)
	return { ...folderData, ...pageData, ...parameterData, ...eventData }
}

// processFolders takes a workbook and comes up with a data structure for the folders.
function processFolders(workbook) {
	const rawFolders = readSheet(workbook, 'folders') // Use readSheet (non-required) for folders
	
	// If no folders exist, return empty structure
	if (rawFolders.length === 0) {
		return {
			folders: {},
			folderList: [],
			folderIds: [],
			mainFolders: []
		}
	}

	// Walk through the folders to process their data and ensure they all have an ID.
	const folders = {}
	const folderIds = [] // A look-up array that turns a row index into a folder ID.
	const folderList = rawFolders.map((rawFolder, index) => {
		const folder = selectAttributes(rawFolder, ['id', 'title'])
		if (!rawFolder.id)
			folder.id = getId()
		folder.contents = []
		folderIds[index] = folder.id // Set up the ID look-up.
		folders[folder.id] = folder
		return folder
	})

	// Check for duplicate IDs.
	const duplicateId = folderList.find((folder, index) => folderList.some((otherFolder, otherIndex) => index < otherIndex && folder.id === otherFolder.id))?.id
	if (duplicateId)
		throw new ProcessingError({ type: 'duplicateId', tab: 'folders', id: duplicateId })

	// Walk through the folders again to sort out parent folders.
	const mainFolders = [] // Which folders are in the main directory?
	rawFolders.forEach((rawFolder, index) => {
		const folder = folderList[index]
		const parentId = ensureId(rawFolder.parent, folderIds, 'folders')

		// Check that there are no cycles in the folder parentage.
		if (parentId && !folders[parentId])
			throw new ProcessingError({ type: 'invalidId', id: parentId, originTab: 'folders', destinationTab: 'folders' })
		if (parentId === folder.id)
			throw new ProcessingError({ type: 'folderOwnParent', folder })
		const hasDescendentWithId = (folder, id) => folder.contents.some(subfolder => subfolder.id === id || hasDescendentWithId(subfolder, id))
		if (hasDescendentWithId(folder, parentId))
			throw new ProcessingError({ type: 'cyclicFolderParentage', folder })

		// Add the folder as a child to the right place.
		if (parentId === undefined)
			mainFolders.push(folder)
		else
			folders[parentId].contents.push(folder)
	})

	// Return all derived parameters.
	return { folders, folderList, folderIds, mainFolders }
}

// processPages puts the pages provided in the Excel file into a more manageable format.
function processPages(workbook, folderData) {
	const { folders, folderIds } = folderData
	const rawPages = readSheetRequired(workbook, 'pages') // Pages are required
	
	// Create array to track the original order from the Excel file
	let rawPageOrder = [];

	// Create arrays to separately track page items and folder items with their order values
	const pageItems = [];
	const folderItems = [];

	// Walk through the pages to process their data.
	const pages = {}
	const pageIds = [] // A look-up array that turns a row index into a folder ID.
	const mainPages = [] // Which pages are in the main directory?
	const pageList = rawPages.map((rawPage, index) => {
		const page = selectAttributes(rawPage, ['id', 'title', 'description', 'options'])
		if (!rawPage.id)
			page.id = getId()
		pageIds[index] = page.id // Set up the ID look-up.
		
		// Get the order value from the Excel file (if exists)
		// It should be in column F (6th column) in the pages sheet
		const orderValue = rawPage.order !== undefined && rawPage.order !== null ? 
			parseInt(rawPage.order, 10) : 
			null; // No default order value
		
		const parentId = ensureId(rawPage.parent, folderIds, 'folders')
		
		// Keep track of pages/folders with their order value
		// Only track items that are in the main directory (no parent)
		if (parentId === undefined) {
			// Store the item with its ID and order value if it has an explicit order
			if (orderValue !== null && !isNaN(orderValue)) {
				const item = { id: page.id, order: orderValue, type: 'page' };
				pageItems.push(item);
				console.log(`Found page with order: ${page.title || 'Untitled'} (${page.id}) - Order: ${orderValue}`);
			}
		}

		// Process the parent of the page.
		if (parentId && !folders[parentId])
			throw new ProcessingError({ type: 'invalidId', id: parentId, originTab: 'folders', destinationTab: 'folders' })
		if (parentId === undefined)
			mainPages.push(page)
		else
			folders[parentId].contents.push(page)

		// Finalize the processing.
		pages[page.id] = page
		return page
	})

	// Check for duplicate IDs.
	const duplicateId = pageList.find((folder, index) => pageList.some((otherFolder, otherIndex) => index < otherIndex && folder.id === otherFolder.id))?.id
	if (duplicateId)
		throw new ProcessingError({ type: 'duplicateId', tab: 'pages', id: duplicateId })

	// Extract the folder IDs and their order values from the folders worksheet
	const folderWorksheet = workbook.getWorksheet(tabNames.folders);
	
	if (folderWorksheet && folderWorksheet.rowCount > 1) {
		// Skip the header row (row 1)
		for (let i = 2; i <= folderWorksheet.rowCount; i++) {
			const row = folderWorksheet.getRow(i);
			const folderId = row.getCell(1).value; // ID is in first column
			const parentId = row.getCell(2).value; // Parent is in second column
			const orderValue = row.getCell(4).value; // Order is in column D (4th column)
			
			// Check if this folder is in folderIds and has no parent
			if (folderId && (!parentId || parentId === '' || parentId === null)) {
				// Process the order value to ensure it's a valid number
				const parsedOrder = orderValue !== undefined && orderValue !== null && orderValue !== '' ? 
					parseInt(orderValue, 10) : null;
				
				// Only add folders with valid explicit order values
				if (parsedOrder !== null && !isNaN(parsedOrder)) {
					folderItems.push({ 
						id: folderId, 
						order: parsedOrder,
						type: 'folder'
					});
					console.log(`Found folder with order: ${folders[folderId]?.title || 'Untitled'} (${folderId}) - Order: ${parsedOrder}`);
				}
			}
		}
	}
	
	// Log found ordered items
	console.log("Excel import - Found ordered items:", {
		orderedPages: pageItems.length,
		orderedFolders: folderItems.length,
	});
	
	// Combine all items with explicit order values
	const allOrderedItems = [...pageItems, ...folderItems];
	
	// Sort the items by their order value (ascending)
	const orderedItems = allOrderedItems.sort((a, b) => a.order - b.order);
	
	// Create arrays for unordered items (those without explicit order values)
	const unorderedPages = mainPages
		.filter(page => !pageItems.some(item => item.id === page.id))
		.map(page => ({ id: page.id, type: 'page' }));
	
	const unorderedFolders = Object.values(folders)
		.filter(folder => !folderItems.some(item => item.id === folder.id))
		.filter(folder => !folderData.folderList.some(f => f.id !== folder.id && (f.contents || []).includes(folder.id))) // Only root folders
		.map(folder => ({ id: folder.id, type: 'folder' }));
	
	// Create the final order: first the explicitly ordered items, then unordered pages, then unordered folders
	const allItems = [
		...orderedItems,
		...unorderedPages,
		...unorderedFolders
	];
	
	// Create the raw page order based on all items
	rawPageOrder = allItems.map(item => item.id);
	
	// Log the order information for debugging
	console.log("Excel import - Final order information:", {
		orderedItems: orderedItems.map(item => ({ 
			id: item.id, 
			order: item.order, 
			type: item.type,
			title: (item.type === 'page' ? pages[item.id]?.title : folders[item.id]?.title) || 'Untitled'
		})),
		finalOrder: rawPageOrder
	});
	
	// Return all derived parameters.
	return { pages, pageList, pageIds, mainPages, rawPageOrder }
}

// processParameters handles the optional parameters tab
function processParameters(workbook) {
	const rawParameters = readSheet(workbook, 'parameters') // Use readSheet (non-required) for parameters
	
	// If no parameters exist, return empty structure
	if (rawParameters.length === 0) {
		return {
			parameters: {},
			parameterList: []
		}
	}

	// Process parameters...
	const parameters = {}
	const parameterList = rawParameters.map((rawParam, index) => {
		const param = selectAttributes(rawParam, ['id', 'name', 'description', 'defaultValue', 'minValue', 'maxValue'])
		if (!rawParam.id)
			param.id = getId()
		parameters[param.id] = param
		return param
	})

	// Check for duplicate IDs
	const duplicateId = parameterList.find((param, index) => 
		parameterList.some((otherParam, otherIndex) => 
			index < otherIndex && param.id === otherParam.id
		)
	)?.id
	if (duplicateId)
		throw new ProcessingError({ type: 'duplicateId', tab: 'parameters', id: duplicateId })

	return { parameters, parameterList }
}

// processEvents handles the optional events tab
function processEvents(workbook) {
	const rawEvents = readSheet(workbook, 'events') // Use readSheet (non-required) for events
	
	// If no events exist, return empty structure
	if (rawEvents.length === 0) {
		return {
			events: {},
			eventList: []
		}
	}

	// Process events...
	const events = {}
	const eventList = rawEvents.map((rawEvent, index) => {
		const event = selectAttributes(rawEvent, ['id', 'title', 'condition', 'page', 'afterwards', 'maxTriggers'])
		if (!rawEvent.id)
			event.id = getId()
		
		// Convert maxTriggers to number if provided
		if (event.maxTriggers !== undefined && event.maxTriggers !== '') {
			event.maxTriggers = parseInt(event.maxTriggers)
			if (isNaN(event.maxTriggers)) {
				delete event.maxTriggers
			}
		} else {
			delete event.maxTriggers
		}
		
		// Validate afterwards field
		if (event.afterwards && !['originalFollowUp', 'eventFollowUp'].includes(event.afterwards)) {
			event.afterwards = 'originalFollowUp' // Default value
		}
		
		events[event.id] = event
		return event
	})

	// Check for duplicate IDs
	const duplicateId = eventList.find((event, index) => 
		eventList.some((otherEvent, otherIndex) => 
			index < otherIndex && event.id === otherEvent.id
		)
	)?.id
	if (duplicateId)
		throw new ProcessingError({ type: 'duplicateId', tab: 'events', id: duplicateId })

	return { events, eventList }
}

// ensureId takes an ID or row-reference. If it's the latter (so a number) then it attempts to find the ID from the corresponding ID-list. On a failure, an error is thrown. It's useful to add tab-data about the referencing tab (origin) and the referenced tab (destination) which is shown in any potential error message to the user.
function ensureId(id, idList, originTab, destinationTab = originTab) {
	if (id === null || id === undefined || id === '')
		return undefined
	if (!isNumber(id))
		return id
	const index = parseInt(id) - rowShift
	if (index < 0 || index > idList.length)
		throw new ProcessingError({ type: 'invalidRowReference', originTab, destinationTab, reference: index + rowShift })
	return idList[index]
}