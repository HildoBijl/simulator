import { deleteField } from 'firebase/firestore'

import { selectAttributes, removeUndefineds } from 'util'
import { markdownToHtml } from './markdown'

import { updateSimulation, updatePage, deletePage } from 'simulations'

// applyChanges takes a simulation and an Excel workbook and applies the changes from that workbook into the Excel file.
export async function applyChanges(simulation, processedWorkbook) {
	await applyFolderAndPageChanges(simulation, processedWorkbook)
}

// applyFolderAndPageChanges applies all changes for folders and pages. It first adds folders/pages, then updates the main simulation contents, and finally removes pages/folders. By doing it in this order, any simulation that receives updates will not get a completely faulty simulation state, reducing crashes.
async function applyFolderAndPageChanges(simulation, processedWorkbook) {
	const { folderList, pageList } = processedWorkbook

	// Update existing folders and add new ones.
	await Promise.all(folderList.map(folder => {
		const data = removeUndefineds(selectAttributes(folder, ['title']), deleteField())
		data.type = 'folder'
		data.contents = folder.contents.map(item => item.id)
		updatePage(simulation.id, folder.id, data, true)
	}))

// Update existing pages and add new ones.
	await Promise.all(pageList.map(folder => {
		const data = removeUndefineds(selectAttributes(folder, ['title', 'description', 'options']), deleteField())

		// Convert description from Markdown to HTML
		if (data.description) {
			data.description = markdownToHtml(data.description)
		}

		// Parse options if they exist
		if (data.options) {
			data.options = data.options.split('\n')
				.filter(line => line.trim()) // Remove empty lines
				.map(line => {
					// Split by pipe character, but handle the case where some fields might be empty
					const parts = line.split('|')
					const description = parts[0] || ''
					const feedback = parts[1] || ''
					const followUpPage = parts[2] || ''
					const updateScript = parts[3] || ''

					const option = {}

					if (description) {
						option.description = markdownToHtml(description)
					}
					if (feedback) {
						option.feedback = markdownToHtml(feedback)
					}
					if (followUpPage) {
						option.followUpPage = followUpPage
					}
					if (updateScript) {
						option.updateScript = updateScript
					}

					console.log("Processed option:", {
						description: description.substring(0, 20) + (description.length > 20 ? '...' : ''),
						hasUpdateScript: !!updateScript
					})

					return option
				})
		}

		data.type = 'page'
		updatePage(simulation.id, folder.id, data, true)
	}))

	// Update the page order of the main simulation.
	await updateSimulation(simulation.id, { pageOrder: [...processedWorkbook.mainFolders.map(folder => folder.id), ...processedWorkbook.mainPages.map(page => page.id)] })

	// Delete old pages.
	const pagesToRemove = Object.values(simulation.pages).filter(oldPage => oldPage.type === 'page' && !processedWorkbook.pages[oldPage.id])
	await Promise.all(pagesToRemove.map(page => deletePage(simulation, page)))

	// Delete old folders.
	const foldersToRemove = Object.values(simulation.pages).filter(oldFolder => oldFolder.type === 'folder' && !processedWorkbook.folders[oldFolder.id])
	await Promise.all(foldersToRemove.map(folder => deletePage(simulation, folder)))
}
