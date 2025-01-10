import { deleteField } from 'firebase/firestore'

import { selectAttributes, removeUndefineds } from 'util'
import { deleteDocument } from 'fb'

import { updateSimulation, updatePage } from 'simulations'

// applyChanges takes a simulation and an Excel workbook and applies the changes from that workbook into the Excel file.
export function applyChanges(simulation, processedWorkbook) {
	applyFolderChanges(simulation, processedWorkbook)
}

async function applyFolderChanges(simulation, processedWorkbook) {
	const { folderList, mainFolders, mainPages } = processedWorkbook

	// Delete old folders.
	const foldersToRemove = Object.values(simulation.pages).filter(oldFolder => oldFolder.type === 'folder' && !processedWorkbook.folders[oldFolder.id])
	await Promise.all(foldersToRemove.map(folder => deleteDocument(`simulations/${simulation.id}/pages`, folder.id)))

	// Update existing folders and add new ones.
	await Promise.all(folderList.map(folder => {
		console.log('Setting', folder.id, folder)
		const data = removeUndefineds(selectAttributes(folder, ['title']), deleteField())
		data.type = 'folder'
		data.contents = folder.contents.map(item => item.id)
		updatePage(simulation.id, folder.id, data, true)
	}))

	// Update the main simulation folder.
	const pageOrder = [...mainFolders.map(folder => folder.id), ...mainPages.map(page => page.id)]
	await updateSimulation(simulation.id, { pageOrder })
}
