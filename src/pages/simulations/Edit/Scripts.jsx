import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tokenize } from 'esprima'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { numberToLetter, useClearTags } from 'util'
import { useSimulation, pageIndexToString } from 'simulations'
import { Page, FormPart } from 'components'

import { hasVariables } from '../util'
import { emptyPage, emptyOption, emptyVariableName, emptyVariableTitle } from '../settings'

import { PageEntryScript, PageUpdateScript, OptionUpdateScript } from './pages'
import { GeneralUpdateScript } from './variables'

const ScriptsPage = ({ children, simulationId }) => <Page title="Simulation Skript Übersicht" backButton={`/create/${simulationId}`}>{children}</Page>

export function Scripts() {
	const navigate = useNavigate()
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)

	// If the simulation is missing, go back to the create page.
	useEffect(() => {
		if (simulation === null)
			navigate('/create')
	}, [simulation, navigate])

	// If the simulation has no variables, go back to the simulation page.
	useEffect(() => {
		if (simulation && !hasVariables(simulation))
			navigate(`/create/${simulation.id}`)
	}, [simulation, navigate])

	// On missing data, we're probably still loading the simulation.
	if (!simulation)
		return <ScriptsPage {...{ simulationId }}><p>Simulation laden...</p></ScriptsPage>

	// Show the simulation form itself.
	return <ScriptsPage {...{ simulationId }}>
		<ScriptsForSimulation simulation={simulation} />
	</ScriptsPage>
}

function ScriptsForSimulation({ simulation }) {
	const [variableId, setVariableId] = useState()
	return <>
		<VariableSelector {...{ simulation, variableId, setVariableId }} />
		<GeneralScripts {...{ variableId, simulation }} />
		{simulation.pageList.map(page => <ScriptsForPage key={page.id} simulation={simulation} page={page} variableId={variableId} />)}
	</>
}

function VariableSelector({ simulation, variableId, setVariableId }) {
	const noFilteringTag = 'noFiltering'
	const expandedSetVariableId = useCallback((variableId) => setVariableId(variableId === noFilteringTag ? undefined : variableId), [setVariableId])
	const label = 'Filtern nach Parameter'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={variableId || noFilteringTag} label={label} onChange={(event) => expandedSetVariableId(event.target.value)}>
				<MenuItem key="default" value={noFilteringTag}>Keine Filterung: alle Skripte anzeigen</MenuItem>
				{Object.values(simulation.variables).map(variable => <MenuItem key={variable.id} value={variable.id}>{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}</MenuItem>)}
			</Select>
		</FormControl>
	</FormPart>
}

function GeneralScripts({ simulation, variableId }) {
	// On a filtering, check if the script contains the given variable.
	const variableName = variableId && simulation.variables[variableId].name
	if (!shouldShowScript(simulation.updateScript, variableName))
		return

	// All in order. Show the field.
	return <>
		<h4>Allgemeine Skripte</h4>
		{simulation.updateScript ? <GeneralUpdateScript {...{ simulation }} /> : null}
	</>
}

function ScriptsForPage({ simulation, page, variableId }) {
	// If the page has no entry/update scripts, or none that match the filtering condition, show nothing.
	const variableName = variableId && simulation.variables[variableId].name
	if (!shouldShowScript(page.entryScript, variableName) && !shouldShowScript(page.updateScript, variableName) && (!page.options || !page.options.some(option => shouldShowScript(option.updateScript, variableName))))
		return null

	// Render the update scripts for this page.
	return <>
		<h4>Seite {pageIndexToString(page.index)} {page.internalTitle || page.title || emptyPage}</h4>
		{shouldShowScript(page.entryScript, variableName) ? <PageEntryScript {...{ simulation, page }} /> : null}
		{shouldShowScript(page.updateScript, variableName) ? <PageUpdateScript {...{ simulation, page }} /> : null}
		{(page.options || []).map((option, optionIndex) => shouldShowScript(option.updateScript, variableName) ? <OptionUpdateScriptWithLabel key={optionIndex} {...{ simulation, page, optionIndex }} /> : null)}
	</>
}

function OptionUpdateScriptWithLabel({ simulation, page, optionIndex }) {
	const option = page.options[optionIndex]
	const description = option.description || emptyOption
	const title = useClearTags(description.split('\n')[0] || emptyOption)
	const label = `${numberToLetter(optionIndex).toUpperCase()}. ${title}`
	return <OptionUpdateScript {...{ simulation, page, optionIndex, label }} />
}

// containsVariable checks if a given script contains a given variable name like 'hp' somewhere.
function containsVariable(script, variableName) {
	return tokenize(script).some(element => element.type === 'Identifier' && element.value === variableName)
}

// shouldShowScript checks if a script should be shown. It must exist and, if a filtering variable is given, it must contain that variable.
function shouldShowScript(script, variableName) {
	if (!script)
		return false
	if (!variableName)
		return true
	return containsVariable(script, variableName)
}
