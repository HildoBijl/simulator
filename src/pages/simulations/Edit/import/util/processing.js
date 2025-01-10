import { isNumber, selectAttributes } from 'util'
import { getId } from 'fb'

import { rowShift } from './settings'
import { ProcessingError } from './checking'
import { readSheet } from './reading'

// processWorkbook takes a workbook (we assume it's been checked for errors) and processes it to a more structured data format.
export function processWorkbook(workbook, simulation) {
	try {
		const processedWorkbook = processWorkbookInner(workbook, simulation)
		return { processedWorkbook }
	} catch (error) {
		if (error.type !== 'ProcessingError')
			throw error // On an unknown error, rethrow.
		return { error }
	}
}

export function processWorkbookInner(workbook, simulation) {
	const folderData = processFolders(workbook)
	console.log(folderData)
	return { ...folderData }
}

// processFolders takes a workbook and comes up with a data structure for the folders.
function processFolders(workbook) {
	const rawFolders = readSheet(workbook, 'folders')
	const folderIds = [] // A look-up array that turns a row index into a folder ID.

	// Walk through the folders to process their data and ensure they all have an ID.
	const folders = {}
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
		if (parentId === undefined) {
			mainFolders.push(folder)
		} else {
			folders[parentId].contents.push(folder)
		}
	})

	// Return all derived parameters.
	return { folders, folderList, folderIds, mainFolders }
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
