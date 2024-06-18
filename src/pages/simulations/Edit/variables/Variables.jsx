import { useState, useCallback, useEffect } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import { setDoc } from 'firebase/firestore'

import { Label, Code, FormPart, TrackedCodeField } from 'components'
import { getVariableRef } from 'simulations'

import { accordionStyle } from '../../settings'
import { getScriptError } from '../../util'

import { Variable } from './Variable'

export function Variables({ simulation }) {
	return <>
		<VariablesList {...{ simulation }} />
		<UpdateScript {...{ simulation }} />
	</>
}

export function VariablesList({ simulation }) {
	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState({})
	const flipExpand = (id) => setExpanded(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Define the order of the variables.
	const { variables } = simulation
	const [order, setOrder] = useState([])
	const updateOrder = useCallback(() => {
		setOrder(Object.keys(variables).sort((key1, key2) => {
			const v1 = variables[key1], v2 = variables[key2]
			if (!v2.name)
				return -1 // Keep v2 later.
			if (!v1.name)
				return 1 // Put v1 later.
			if (v1.name !== v2.name)
				return v1.name < v2.name ? -1 : 1
			if (!v2.title)
				return -1 // Keep v2 later.
			if (!v1.title)
				return 1 // Put v1 later.
			if (v1.title !== v2.title)
				return v1.title < v2.title ? -1 : 1
			return -1 // Equal name and title: keep later parameter last.
		}))
	}, [setOrder, variables])
	useEffect(() => updateOrder(), [updateOrder, variables])

	// Set up a handler to create a new variable and open it on entry. Ensure, on a clone, that it has no ID set.
	const addVariable = async (initialValue = {}) => {
		const ref = getVariableRef(simulation.id)
		setExpanded(expanded => ({ ...expanded, [ref.id]: true }))
		return await setDoc(ref, initialValue)
	}

	// duplicateVariable takes a variable and creates a copy of it, storing it in the database.
	const duplicateVariable = async (variableId) => {
		flipExpand(variableId) // First close the current variable.
		const newVariable = { ...variables[variableId] }
		delete newVariable.id
		return await addVariable(newVariable) // Then add the new one.
	}

	// If there are no variables, show an introduction.
	if (Object.keys(simulation.variables).length === 0)
		return <VariablesIntroduction addVariable={addVariable} />

	// Render the variables through an Accordion.
	return <FormPart>
		<Label>Parameter</Label>
		{order.map((variableId, index) => <Variable key={variableId} {...{ simulation, variable: variables[variableId], index, expanded: !!expanded[variableId], flipExpand: () => flipExpand(variableId), duplicate: () => duplicateVariable(variableId) }} />)}
		<Accordion sx={accordionStyle} onClick={() => addVariable()} expanded={false}>
			<AccordionSummary>
				<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
			</AccordionSummary>
		</Accordion>
	</FormPart>
}

function VariablesIntroduction({ addVariable }) {
	return <>
		<p>Eine Parameter ist eine Zahl, die angepasst wird, während der Benutzer das Spiel spielt. Sie kann eine beliebige Größe sein, wie Geld,  Zufriedenheit oder Lebenspunkte.</p>
		<p>Um Parameter zu verwenden, müssen sie zunächst hier definiert werden. Dann kann für jede Frage oder Antwortmoglichkeit angegeben werden, wie sie angepasst werden sollen: das Update-Skript.</p>
		<p>Ein Beispiel für ein Update-Skript für eine Variable <Code>x</Code> könnte lauten &quot;<Code>x = 10</Code>&quot; oder &quot;<Code>x = x - 2</Code>&quot; oder &quot;<Code>x = x + randInt(2, 4)</Code>&quot; oder &quot;<Code>x = x - rand(0.25, 1.75)</Code>&quot;. Die verwendete Sprache ist Javascript, so dass Sie die genauen Formatierungskriterien nach Belieben nachschlagen können.</p>
		<FormPart>
			<AddVariable addVariable={addVariable} />
		</FormPart>
	</>
}

function AddVariable({ addVariable }) {
	return <Accordion sx={accordionStyle} onClick={() => addVariable()} expanded={false}>
		<AccordionSummary>
			<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
		</AccordionSummary>
	</Accordion>
}

function UpdateScript({ simulation }) {
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	return <FormPart>
		<TrackedCodeField label={<>Zusätzliches Update-Skript nach <em>jeder</em> Frage</>} value={simulation.updateScript} path="simulations" documentId={simulation.id} field="updateScript" multiline={true} getError={getError} />
	</FormPart>
}
