import { useState, useMemo } from 'react'
import { setDoc, arrayUnion } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import { Help as HelpIcon, Info as InfoIcon, Folder as FolderIcon, UnfoldLess as CloseIcon, UnfoldMore as OpenIcon, UnfoldLessDouble as CloseAllIcon, UnfoldMoreDouble as OpenAllIcon } from '@mui/icons-material'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

import { nestedListToIndices, insertIntoArray, isDragDataValid } from 'util'
import { FormPart, Label } from 'components'
import { updateSimulation, getPageRef, movePage } from 'simulations'

import { accordionStyle } from '../../util/settings'

import { PageOrFolder } from './PageOrFolder'

export function PageList({ simulation }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const [expandedMap, setExpandedMap] = useState({})
	const flipExpand = (id) => setExpandedMap(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Set up a list of all draggable items to render them one by one.
	const { pages, pageOrder } = simulation
	const { structure: draggableStructure, list: draggableList } = useMemo(() => {
		const structure = expandFolders(pageOrder, pages, expandedMap)
		const list = structure.flat(Infinity)
		return { list, structure }
	}, [pages, pageOrder, expandedMap])

	// On a drag start, already save the move inside a state.
	const [move, setMove] = useState() // An array of indices, like [4, 2] when element 4 moves to spot 2.
	const onDragStart = (dragData) => {
		setMove([dragData.source.index, dragData.source.index])
	}

	// On a drag update, save the move inside a state.
	const onDragUpdate = (dragData) => {
		if (!isDragDataValid(dragData, draggableList))
			return
		setMove([dragData.source.index, dragData.destination.index])
	}

	// On a drag end, save it to the database.
	const onDragEnd = async (dragData) => {
		// Reset any dragging parameters.
		setMove()

		// On an invalid drag, or on a useless drag, do nothing.
		if (!isDragDataValid(dragData, draggableList))
			return
		const from = dragData.source.index
		const to = dragData.destination.index
		if (from === to)
			return

		// Get all the data about the move and store it in the database.
		const { pageToMove, originFolder, destinationFolder, index } = getMoveData(simulation, draggableList, from, to)
		await movePage(simulation, pageToMove, originFolder, destinationFolder, index)
	}

	// Determine move data depending on the move command stored.
	const moveData = useMemo(() => move && getMoveData(simulation, draggableList, move[0], move[1]), [simulation, draggableList, move])

	// For each page, determine the indices. Also take into account a potential move.
	const indices = useMemo(() => {
		// First apply the move to the existing structure.
		const structure = moveData ? expandFolders(simulation.pageOrder, simulation.pages, undefined, moveData) : draggableStructure

		// Then turn the structure into a list of indices.
		const indicesList = nestedListToIndices(structure)
		const list = structure.flat(Infinity)

		// Finally couple the indices to the page IDs for easy reference.
		const indices = {}
		list.forEach((page, index) => {
			if (page.type === 'folder' && page.closer)
				return
			indices[page.id] = indicesList[index]
		})
		return indices
	}, [simulation, moveData, draggableStructure])

	// Render the pages through an Accordion.
	return <FormPart style={{ marginTop: '1.6rem' }}>
		{simulation.pageList.length === 0 ? <Alert severity="info" sx={{ my: 2 }}>Klicken Sie auf die Schaltfläche unten, um Ihre erste Info- oder Frageseite hinzuzufügen. Wenn Sie später zu viele Fragen bekommen, können Sie auch Ordner hinzufügen, um sie zu strukturieren.</Alert> : null}
		<Label>Seiten</Label>
		<ExpandButtons {...{ simulation, expandedMap, setExpandedMap }} />
		<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
			<Droppable droppableId="pages">{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					{...provided.droppableProps}
					style={{ ...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {}) }}>
					{draggableList.map((page, index) => <PageOrFolder
						key={`${page.id}${page.closer ? '-closer' : ''}`}
						{...{
							simulation,
							page,
							dragIndex: index,
							listIndex: indices[page.id],
							expanded: !!expandedMap[page.id],
							isDragging: moveData?.pageToMove?.id === page.id, isDestinationFolder: moveData?.destinationFolder?.id === page.id,
							flipExpand: () => flipExpand(page.id)
						}} />)}
					{provided.placeholder}
					<AddPageButton {...{ simulation, setExpandedMap }} />
					<AddFolderButton {...{ simulation, setExpandedMap }} />
				</div>
			)}</Droppable>
		</DragDropContext>
	</FormPart>
}

function ExpandButtons({ simulation, expandedMap, setExpandedMap }) {
	// Define handlers to open and close all folders and possibly questions.
	const openAllFoldersAndQuestions = () => {
		setExpandedMap(expandedMap => {
			expandedMap = { ...expandedMap }
			Object.values(simulation.pages).forEach(page => {
				expandedMap[page.id] = true
			})
			return expandedMap
		})
	}
	const openAllFolders = () => {
		setExpandedMap(expandedMap => {
			expandedMap = { ...expandedMap }
			Object.values(simulation.pages).forEach(page => {
				if (page.type === 'folder')
					expandedMap[page.id] = true
			})
			return expandedMap
		})
	}
	const closeAllFolders = () => {
		setExpandedMap(expandedMap => {
			expandedMap = { ...expandedMap }
			Object.values(simulation.pages).forEach(page => {
				if (page.type === 'folder')
					delete expandedMap[page.id]
			})
			return expandedMap
		})
	}
	const closeAllFoldersAndQuestions = () => setExpandedMap({})

	// Check if the buttons are available.
	const isEmptyFolder = page => page.type === 'folder' && (!page.contents || page.contents.length === 0)
	const allFoldersAndQuestionsClosed = Object.keys(expandedMap).every(pageId => !expandedMap[pageId] || !simulation.pages[pageId] || isEmptyFolder(simulation.pages[pageId])) // There are no open pages/folders: all open items are either non-existing, or empty folders.
	const allFoldersClosed = Object.keys(expandedMap).every(pageId => !expandedMap[pageId] || !simulation.pages[pageId] || simulation.pages[pageId].type !== 'folder' || isEmptyFolder(simulation.pages[pageId])) // There are no open folders: all open items are either non-existing, not folders, or empty folders.
	const allFoldersOpen = Object.values(simulation.pages).every(page => page.type !== 'folder' || isEmptyFolder(page) || expandedMap[page.id]) // All folders are either empty or expanded.
	const allFoldersAndQuestionsOpen = Object.values(simulation.pages).every(page => isEmptyFolder(page) || expandedMap[page.id]) // All folders and questions are either empty or expanded.

	// Render the buttons, using an outer container with no height and an inner container for the buttons.
	const buttonStyle = {
		cursor: 'pointer',
		padding: '3px',
	}
	const buttonStyleInactive = {
		...buttonStyle,
		opacity: 0.5,
		cursor: 'default',
	}
	return <div style={{ width: '100%', height: 0, position: 'relative' }}>
		<div style={{ position: 'absolute', right: 0, bottom: 0, display: 'flex', flexFlow: 'row nowrap' }}>
			<Tooltip title="Alle Ordner und Fragen aufklappen" arrow enterDelay={500}>
				<OpenAllIcon onClick={openAllFoldersAndQuestions} sx={allFoldersAndQuestionsOpen ? buttonStyleInactive : buttonStyle} />
			</Tooltip>
			<Tooltip title="Alle Ordner aufklappen" arrow enterDelay={500}>
				<OpenIcon onClick={openAllFolders} sx={allFoldersOpen ? buttonStyleInactive : buttonStyle} />
			</Tooltip>
			<Tooltip title="Alle Ordner schließen" arrow enterDelay={500}>
				<CloseIcon onClick={closeAllFolders} sx={allFoldersClosed ? buttonStyleInactive : buttonStyle} />
			</Tooltip>
			<Tooltip title="Alle Fragen und Ordner schließen" arrow enterDelay={500}>
				<CloseAllIcon onClick={closeAllFoldersAndQuestions} sx={allFoldersAndQuestionsClosed ? buttonStyleInactive : buttonStyle} />
			</Tooltip>
		</div>
	</div>
}

function AddPageButton({ simulation, setExpandedMap }) {
	const theme = useTheme()

	// Set up an addPage handler that opens a new page upon entry.
	const addPage = async () => {
		const ref = getPageRef(simulation.id)
		setExpandedMap(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, { type: 'page' })
		await updateSimulation(simulation.id, { pageOrder: arrayUnion(ref.id), startingPage: simulation.startingPage || ref.id })
	}

	// Render the button as an accordion item.
	return <AddButton onClick={addPage} title="Neue Seite/Frage">
		<InfoIcon style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.info.main }} />
		<div style={{ fontSize: '1.2em', transform: 'translateY(-2px)' }}>/</div>
		<HelpIcon style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.primary.main }} />
	</AddButton>
}

function AddFolderButton({ simulation, setExpandedMap }) {
	const theme = useTheme()

	// Set up an addFolder handler that opens a new folder upon entry.
	const addFolder = async () => {
		const ref = getPageRef(simulation.id)
		setExpandedMap(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, { type: 'folder' })
		await updateSimulation(simulation.id, { pageOrder: arrayUnion(ref.id) })
	}

	// Render the button as an accordion item.
	return <AddButton onClick={addFolder} title="Neuer Ordner">
		<FolderIcon style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.secondary.main }} />
	</AddButton>
}

function AddButton({ onClick, children, title }) {
	return <Accordion sx={accordionStyle} onClick={onClick} expanded={false}>
		<AccordionSummary>
			<Tooltip title={title} arrow enterDelay={500}>
				<div style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center', lineHeight: '0.7em', textAlign: 'center', width: '100%' }}>
					<div style={{ fontSize: '2em', transform: 'translateY(-3px)' }}>+</div>
					<div style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '4em' }}>
						{children}
					</div>
				</div>
			</Tooltip>
		</AccordionSummary>
	</Accordion>
}

// expandFolders takes a list of pages (or page IDs) with potential folders in them. It then not only turns the ID into the page/folder, but also (assuming the folder is opened) includes all pages (and recursively all folders) inside the folder. At the end it adds a folder-closer, which is needed for the dragging system.
function expandFolders(pageList, pages, expandedMap, moveData, topLevel = true) {
	const { pageToMove, originFolder, destinationFolder, index } = moveData || {}
	let list = [...(pageList || [])]

	// If we are on the top level of the page list, and there is a move command, apply it. First remove the page to move and then insert it where needed.
	if (topLevel && moveData && pageToMove && !originFolder) {
		const index = list.indexOf(pageToMove.id)
		list = [...list.slice(0, index), ...list.slice(index + 1)]
	}
	if (topLevel && moveData && pageToMove && !destinationFolder) {
		list = insertIntoArray(list, index, pageToMove.id)
	}

	// Walk through the page list to set up its contents.
	return list.map(page => {
		// Ensure we have a page object.
		if (typeof page === 'string')
			page = pages[page]
			if (!page) {
				// Adds safety check for non-existing pages
				console.warn(`Page with ID "${page} not found. It may have been deleted."`);
				return null;
			}

		// For folders, add an opener and a closer and, if needed, contents.
		if (page.type === 'folder') {
			// Set up the default value for a closed folder.
			const value = [{ ...page }, { ...page, closer: true }]

			// If all folders are examined, or if specifically the folder is opened, also add contents.
			if (!expandedMap || expandedMap[page.id]) {
				// If there is a move, implement it into the contents.
				let contents = page.contents || []
				if (pageToMove && originFolder && originFolder.id === page.id) {
					const index = contents.indexOf(pageToMove.id)
					contents = [...contents.slice(0, index), ...contents.slice(index + 1)]
				}
				if (pageToMove && destinationFolder && destinationFolder.id === page.id) {
					contents = insertIntoArray(contents, index, pageToMove.id)
				}

				// Add the contents, but filter out nulls
				const processedContents = expandFolders(contents || [], pages, expandedMap, moveData, false)
					.filter(Boolean) // Filter out null values
				value.splice(1, 0, ...processedContents)}

			// Return the result.
			return value
		}

		// For pages directly return the page.
		if (page.type === 'page')
			return page
		return null  // safety default
	}).filter(Boolean);
}

// getMoveData takes a (flattened) list of pages and a move command: which should move to where. It then determines which page will be moved, from which folder, to which folder, and what the new index there will be.
function getMoveData(simulation, draggableList, from, to) {
	// Find the page to be move.
	const pageToMove = draggableList[from]
	if (!pageToMove) {
		console.warn('Cannot process move - page at source index not found');
		return null;
	}

	// If a folder is moved right after its closer, consider it as "at the same place".
	if (pageToMove.type === 'folder' && to - from === 1)
		to = from

	// Determine the origin of the page that will be moved.
	const originFolder = Object.values(simulation.pages).find(page => page.type === 'folder' && page.contents && page.contents.find(folderContent => folderContent.id === pageToMove.id))

	// Determine the destination, and the index within the destination folder.
	let destinationFolder, index
	if (to === 0) {
		index = 0
	} else {
		const shouldComeAfter = draggableList[to <= from ? to - 1 : to]
		const shouldComeBefore = draggableList[to <= from ? to : to + 1]
		if (shouldComeAfter && shouldComeAfter.type === 'folder' && !shouldComeAfter.closer) { // Should it be put into a (closed) folder?
			destinationFolder = shouldComeAfter
			index = shouldComeBefore.id === shouldComeAfter.id ? (shouldComeAfter.contents?.length || 0) : 0 // For a closed folder, put at the end. For an open folder, put at the start.
		} else {
			destinationFolder = Object.values(simulation.pages).find(page => page.type === 'folder' && page.contents && page.contents.find(folderContent => folderContent.id === shouldComeAfter.id))
			const destinationArray = destinationFolder ? destinationFolder.contents : simulation.pageTree
			index = destinationArray.findIndex(page => page.id === shouldComeAfter.id) + 1
			const oldIndex = destinationArray.findIndex(page => page.id === pageToMove.id)
			if (oldIndex !== -1 && oldIndex < index)
				index-- // If the item was already in this list prior to the index, the desired index should be one lower.
		}
	}

	return { pageToMove, originFolder, destinationFolder, index }
}
