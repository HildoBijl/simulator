import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { DragIndicator, AddCircle, Delete } from '@mui/icons-material'

import { lastOf, numberToLetter } from 'util'
import { FormPart, TrackedCodeField } from 'components'
import { updatePage, pageIndexToString } from 'simulations'

import { emptyPage, hasVariables, getExpressionError } from '../../util'

export function FollowUpDropdown({ simulation, page, optionIndex }) {
	const options = page.options || []
	const option = options[optionIndex]
	const forPage = (optionIndex === undefined)

	// Set up a handler to save the follow-up page and the follow-up conditions.
	const setFollowUpPage = async (pageId) => {
		// For a page, save the setting inside the page object.
		if (forPage)
			return await updatePage(simulation.id, page.id, { followUpPage: pageId === 'default' ? deleteField() : pageId })

		// For an option, save the setting inside the respective option list entry.
		const newOption = { ...option, followUpPage: pageId }
		if (pageId === 'default')
			delete newOption.followUpPage
		return await updatePage(simulation.id, page.id, { options: [...options.slice(0, optionIndex), newOption, ...options.slice(optionIndex + 1)] })
	}
	const setFollowUpConditions = async (conditions) => {
		// For a page, save the setting inside the page object.
		if (forPage)
			return await updatePage(simulation.id, page.id, { followUpConditions: conditions.length === 0 ? deleteField() : conditions })

		// For an option, save the setting inside the respective option list entry.
		const newOption = { ...option, followUpConditions: conditions }
		if (conditions.length === 0)
			delete newOption.followUpConditions
		return await updatePage(simulation.id, page.id, { options: [...options.slice(0, optionIndex), newOption, ...options.slice(optionIndex + 1)] })
	}

	// Determine the extra message to show for the field, giving info on where this will be used.
	const optionsWithFollowUp = (page.options || []).map(option => !!option.followUpPage)
	const allOptionsHaveFollowUp = optionsWithFollowUp.every(value => value)
	const noOptionsHaveFollowUp = !optionsWithFollowUp.some(value => value)
	const optionsWithoutFollowUp = optionsWithFollowUp.map((value, index) => !value && numberToLetter(index).toUpperCase()).filter(value => value)
	const extraMessage = allOptionsHaveFollowUp ? 'derzeit nicht verwendet; alle Möglichkeiten haben eine eigene Folgeseite' : noOptionsHaveFollowUp ? 'für alle Möglichkeiten, da keine eine eigene Folgeseite hat' : `für die Möglichkeit${optionsWithoutFollowUp.length === 1 ? ` (nur ${optionsWithoutFollowUp.join('/')})` : `en ${optionsWithoutFollowUp.join('/')}`} ohne eigene Folgeseite`
	const label = forPage && options.length > 0 ? `Standard Folgeseite (${extraMessage})` : 'Folgeseite'

	// Render the dropdown field.
	const nextPage = getNextPage(simulation, page)
	const followUpPage = (forPage ? page.followUpPage : option.followUpPage) || 'default'
	const followUpConditions = (forPage ? page.followUpConditions : option.followUpConditions) || []
	return <>
		<PageDropdown
			simulation={simulation}
			label={label}
			before={{
				default: forPage ? `Standard: Nächste Seite in der Reihenfolge (jetzt ${nextPage ? `Seite ${pageIndexToString(nextPage.index)}` : 'das Ende der Simulation'})` : 'Die Standardeinstellung dieser Frage verwenden',
				conditional: hasVariables(simulation) ? 'Von Parameterwerten abhängig machen' : undefined
			}}
			after={{ end: 'Ende: Danach wird die Simulation beendet' }}
			value={followUpPage}
			setValue={setFollowUpPage}
		/>
		{followUpPage === 'conditional' ? <ConditionalFields {...{ simulation, page, forPage, conditions: followUpConditions, setConditions: setFollowUpConditions }} /> : null}
	</>
}

function ConditionalFields({ simulation, page, forPage, conditions, setConditions }) {
	const hasFallback = (typeof lastOf(conditions) === 'string')
	const fallback = hasFallback ? lastOf(conditions) : undefined

	// Set up a handler to change a specific item. (An item is a combination of a condition and a page.)
	const setItem = (index, item) => setConditions([...conditions.slice(0, index), item, ...conditions.slice(index + 1)])

	// Set up a handler to add/delete a condition.
	const addItem = () => {
		setConditions(hasFallback ? [...conditions.slice(0, -1), {}, lastOf(conditions)] : [...conditions, {}])
	}
	const deleteItem = (index) => {
		setConditions([...conditions.slice(0, index), ...conditions.slice(index + 1)])
	}

	// Set up a handler to set the fallback value.
	const setFallback = (fallback) => {
		// Remove potential old conditions.
		let newConditions = hasFallback ? conditions.slice(0, -1) : conditions

		// Add in the new conditions.
		const shouldHaveFallback = (fallback !== 'default')
		if (shouldHaveFallback)
			newConditions = [...newConditions, fallback]

		// On a change, apply it.
		if (hasFallback || shouldHaveFallback)
			setConditions(newConditions)
	}

	// Render the conditions.
	return <>
		{conditions.filter(item => typeof item !== 'string').map((item, index) => <ConditionItem key={index} {...{
			simulation, page, forPage, item,
			setItem: (condition) => setItem(index, condition),
			deleteItem: () => deleteItem(index),
		}} />)}
		<ConditionAdder addCondition={addItem} />
		<ConditionFallback {...{ simulation, page, forPage, fallback, setFallback }} />
		{conditions.length === 0 ? <Alert severity="info" sx={{ mb: 3 }}>Sie können hier oben verschiedene Bedingungen hinzufügen, die jeweils eine eigene Folgeseite haben. Die erste Bedingung, die zutrifft, wird verwendet.</Alert> : null}
	</>
}

function ConditionItem({ simulation, page, forPage, item, setItem, deleteItem }) {
	const theme = useTheme()

	// Define handlers.
	const setPage = (page) => {
		const newItem = { ...item, page }
		if (page === 'default')
			delete newItem.page
		setItem(newItem)
	}
	const setCondition = (condition) => {
		const newItem = { ...item, condition }
		if (!condition)
			delete newItem.condition
		setItem(newItem)
	}

	// Set up error handling for the condition.
	const getError = useCallback((condition) => getExpressionError(condition, simulation, { requireBoolean: true }), [simulation])

	// Render the form.
	const { condition } = item
	const nextPage = getNextPage(simulation, page)
	return <Box sx={{ display: 'flex', flexFlow: 'row nowrap', alignItems: 'flex-start', my: 2 }}>
		<Box sx={{ mr: 1, mt: 2 }}>
			<DragIndicator sx={{ cursor: 'grab' }} />
		</Box>
		<Box sx={{
			flexGrow: 1, display: 'flex', flexFlow: 'column nowrap', alignItems: 'stretch', gap: '0.8rem',
			[theme.breakpoints.up('md')]: { flexFlow: 'row nowrap', alignItems: 'flex-start' },
		}}>
			<Box sx={{ flex: 1 }}>
				<TrackedCodeField label={`Bedingung${condition ? '' : ' (z. B. "leben < 0 || geld >= 20")'}`} value={condition} setValue={setCondition} getError={getError} />
			</Box>
			<Box sx={{ flex: 1 }}>
				<PageDropdown
					simulation={simulation}
					label="Entsprechende Folgeseite"
					before={{ default: forPage ? `Standard: Nächste Seite in der Reihenfolge (jetzt ${nextPage ? `Seite ${pageIndexToString(nextPage.index)}` : 'das Ende der Simulation'})` : 'Die Standardeinstellung dieser Frage verwenden' }}
					after={{ end: 'Ende: Danach wird die Simulation beendet' }}
					value={item.page || 'default'}
					setValue={setPage}
					noFormPart={true}
				/>
			</Box>
		</Box>
		<Box sx={{ ml: 1, mr: 0.5, mt: 2 }}>
			<Delete sx={{ cursor: 'pointer', opacity: 0.5, '&:hover': { opacity: 1 } }} onClick={deleteItem} />
		</Box>
	</Box>
}

function ConditionAdder({ addCondition }) {
	const theme = useTheme()
	const height = '2px'
	const color = theme.palette.text.primary
	return <Box sx={{
		height: '1.2rem', width: '100%',
		my: 1,
		display: 'flex',
		flexFlow: 'row nowrap',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		opacity: 0.5,
		'&:hover': { opacity: 1 },
	}} onClick={addCondition}>
		<Box sx={{ background: color, height, flexGrow: 1 }} />
		<Box sx={{ height }}><AddCircle sx={{ color, transform: 'translateY(-46%)' }} /></Box>
		<Box sx={{ background: color, height, flexGrow: 1 }} />
	</Box>
}

function ConditionFallback({ simulation, page, forPage, fallback, setFallback }) {
	const nextPage = getNextPage(simulation, page)
	return <PageDropdown
		simulation={simulation}
		label="Fallback Folgefrage, wenn keine Bedingung erfüllt ist"
		before={{
			default: forPage ? `Standard: Nächste Seite in der Reihenfolge (jetzt ${nextPage ? `Seite ${pageIndexToString(nextPage.index)}` : 'das Ende der Simulation'})` : 'Die Standardeinstellung dieser Frage verwenden'
		}}
		after={{
			end: 'Ende: Danach wird die Simulation beendet'
		}}
		value={fallback || 'default'}
		setValue={setFallback}
	/>
}

export function PageDropdown({ simulation, before = {}, after = {}, label, value, setValue, noFormPart }) {
	// Set up the dropdown.
	const contents = <FormControl fullWidth>
		<InputLabel>{label}</InputLabel>
		<Select value={value} label={label} onChange={(event) => setValue(event.target.value)}>
			{Object.keys(before).map(key => before[key] ? <MenuItem key={key} value={key}>{before[key]}</MenuItem> : null)}
			{simulation.pageList.map(otherPage => <MenuItem key={otherPage.id} value={otherPage.id}>{pageIndexToString(otherPage.index)} {otherPage.internalTitle || otherPage.title || emptyPage}</MenuItem>)}
			{Object.keys(after).map(key => after[key] ? <MenuItem key={key} value={key}>{after[key]}</MenuItem> : null)}
		</Select>
	</FormControl>

	// Add a form part unless specifically indicated otherwise.
	return noFormPart ? contents : <FormPart>{contents}</FormPart>
}

function getNextPage(simulation, page) {
	const currPageIndex = simulation.pageList.findIndex(currPage => currPage.id === page.id)
	return simulation.pageList[currPageIndex + 1]
}
