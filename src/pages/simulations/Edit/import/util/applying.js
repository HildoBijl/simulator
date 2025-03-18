import { deleteField } from 'firebase/firestore'

import { selectAttributes, removeUndefineds } from 'util'
import { markdownToHtml } from './markdown'

import { updateSimulation, updatePage, deletePage } from 'simulations'
import { updateVariable, deleteVariable } from 'simulations/variables/functions'

// applyChanges takes a simulation and an Excel workbook and applies the changes from that workbook into the Excel file.
export async function applyChanges(simulation, processedWorkbook) {
	await applyFolderAndPageChanges(simulation, processedWorkbook)
	await applyParameterChanges(simulation, processedWorkbook)
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

// applyParameterChanges applies all changes for parameters/variables. It adds new parameters, updates existing ones, and removes deleted ones.
async function applyParameterChanges(simulation, processedWorkbook) {
	const { parameters, parameterList } = processedWorkbook
	
	// If no parameters data is available, don't try to update anything
	if (!parameters || !parameterList || parameterList.length === 0) {
		console.log("No parameters to update")
		return
	}
	
	// Make sure simulation.variables exists
	if (!simulation.variables) {
		simulation.variables = {}
	}
	
	console.log("Processing parameters:", parameterList.length)
	
	// Update existing parameters and add new ones
	try {
		// Import Firebase directly to ensure we have access
		const { doc, setDoc } = await import('firebase/firestore')
		const { db } = await import('fb')
		
		// Use Promise.all to process all parameters in parallel
		await Promise.all(parameterList.map(async parameter => {
			// Make sure we have all required fields
			const data = {
				name: parameter.name || '',
				title: parameter.title || '',
				initialValue: parameter.initialValue || '0',
			}
			
			// Add optional fields if they exist
			if (parameter.minValue !== undefined && parameter.minValue !== null && parameter.minValue !== '') {
				data.minValue = parameter.minValue
			}
			
			if (parameter.maxValue !== undefined && parameter.maxValue !== null && parameter.maxValue !== '') {
				data.maxValue = parameter.maxValue
			}
			
			// Log the update for debugging
			console.log("Updating parameter using direct Firebase:", parameter.id, data)
			
			// Update the parameter in the database directly using Firebase
			try {
				// Create a reference to the parameter document
				const paramRef = doc(db, `simulations/${simulation.id}/variables`, parameter.id)
				
				// Use setDoc with merge: true to create if not exists or update if exists
				await setDoc(paramRef, data, { merge: true })
				
				console.log(`Parameter ${parameter.id} updated successfully!`)
				return Promise.resolve()
			} catch (error) {
				console.error("Error updating parameter with direct Firebase:", parameter.id, error)
				// Continue with other parameters instead of throwing
				return Promise.resolve()
			}
		}))
	} catch (error) {
		console.error("Error in parameter batch update:", error)
	}
	
	// Delete old parameters - continue to use deleteVariable as it's simpler
	try {
		const parametersToRemove = Object.values(simulation.variables || {})
			.filter(oldParam => !parameters[oldParam.id])
			
		if (parametersToRemove.length > 0) {
			console.log("Removing parameters:", parametersToRemove.length, 
				parametersToRemove.map(p => p.name || p.id).join(', '))
			
			await Promise.all(parametersToRemove.map(async param => {
				try {
					return await deleteVariable(simulation, param)
				} catch (error) {
					console.error("Error deleting parameter:", param.id, error)
					// Continue with other parameters instead of throwing
					return Promise.resolve()
				}
			}))
		}
	} catch (error) {
		console.error("Error in parameter deletion:", error)
	}
}
