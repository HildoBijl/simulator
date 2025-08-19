import { deleteField } from 'firebase/firestore'

import { selectAttributes, removeUndefineds } from 'util'
import { markdownToHtml } from './markdown'

import { updateSimulation, updatePage, deletePage } from 'simulations'
import { deleteVariable } from 'simulations/variables/functions'
import { updateDocument } from 'fb'

// applyChanges takes a simulation and an Excel workbook and applies the changes from that workbook into the Excel file.
export async function applyChanges(simulation, processedWorkbook) {
	await applyFolderAndPageChanges(simulation, processedWorkbook)
	
	// Only apply parameter changes if parameters exist
	if (processedWorkbook.parameterList && processedWorkbook.parameterList.length > 0) {
		console.log('Applying parameter changes for', processedWorkbook.parameterList.length, 'parameters')
		await applyParameterChanges(simulation, processedWorkbook)
	} else {
		console.log('No parameters to apply')
	}
	
	// Only apply event changes if events exist
	if (processedWorkbook.eventList && processedWorkbook.eventList.length > 0) {
		console.log('Applying event changes for', processedWorkbook.eventList.length, 'events')
		await applyEventChanges(simulation, processedWorkbook)
	} else {
		console.log('No events to apply')
	}
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

	// Update the page order of the main simulation
	// FIXED: Preserve original Excel sheet row order instead of grouping folders first then pages
	// Get the order directly from the worksheet rows to maintain original order
	let newPageOrder = [];
	
	// Check if we have raw Excel data in processedWorkbook
	if (processedWorkbook.rawPageOrder && processedWorkbook.rawPageOrder.length > 0) {
		// If the raw order is available, use it directly
		newPageOrder = processedWorkbook.rawPageOrder;
	} else {
		// Fall back to the previous logic but with console warning
		console.warn('Raw page order not available, falling back to default ordering logic');
		newPageOrder = [...processedWorkbook.mainFolders.map(folder => folder.id), 
		               ...processedWorkbook.mainPages.map(page => page.id)];
	}
	
	// Apply the page order update
	await updateSimulation(simulation.id, { 
		pageOrder: newPageOrder,
		lastModified: new Date().toISOString()
	});

	// Delete old pages
	const pagesToRemove = Object.values(simulation.pages).filter(oldPage => oldPage.type === 'page' && !processedWorkbook.pages[oldPage.id])
	await Promise.all(pagesToRemove.map(page => deletePage(simulation, page)))

	// Delete old folders
	const foldersToRemove = Object.values(simulation.pages).filter(oldFolder => oldFolder.type === 'folder' && !processedWorkbook.folders[oldFolder.id])
	await Promise.all(foldersToRemove.map(folder => deletePage(simulation, folder)))
}

// applyParameterChanges applies all changes for parameters/variables.
// It adds new parameters, updates existing ones, and removes deleted ones
async function applyParameterChanges(simulation, processedWorkbook) {
	const { parameterList } = processedWorkbook
	
	console.log('Processing parameters:', parameterList)
	
	// Update existing parameters and add new ones
	await Promise.all(parameterList.map(async param => {
		console.log('Processing parameter:', param)
		
		const data = removeUndefineds(selectAttributes(param, [
			'name', 'description', 'defaultValue', 'minValue', 'maxValue'
		]), deleteField())
		
		// Map description to title for variables (variables use 'title' not 'description')
		if (data.description) {
			data.title = data.description
			delete data.description
		}
		
		// Map defaultValue to initialValue for variables
		if (data.defaultValue !== undefined) {
			data.initialValue = data.defaultValue
			delete data.defaultValue
		}
		
		console.log('Saving parameter data:', data, 'with ID:', param.id)
		
		// Use updateDocument directly with setOnNonExistent=true to create variables that don't exist
		return await updateDocument(`simulations/${simulation.id}/variables`, param.id, data, true)
	}))
	
	console.log('Finished applying parameter changes')
}

// applyEventChanges applies all changes for events.
// It adds new events, updates existing ones, and removes deleted ones
async function applyEventChanges(simulation, processedWorkbook) {
	const { eventList } = processedWorkbook
	
	console.log('Processing events:', eventList)
	
	// Update existing events and add new ones
	await Promise.all(eventList.map(async event => {
		console.log('Processing event:', event)
		
		const data = removeUndefineds(selectAttributes(event, [
			'title', 'condition', 'page', 'afterwards', 'maxTriggers'
		]), deleteField())
		
		console.log('Saving event data:', data, 'with ID:', event.id)
		
		// Use updateDocument directly with setOnNonExistent=true to create events that don't exist
		return await updateDocument(`simulations/${simulation.id}/events`, event.id, data, true)
	}))
	
	console.log('Finished applying event changes')
}