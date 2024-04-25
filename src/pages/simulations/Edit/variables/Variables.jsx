import { useState, useCallback, useEffect } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import { setDoc } from 'firebase/firestore'

import { FormPart } from '../../../../components'
import { getVariableRef } from '../../../../simulations'

import { accordionStyle } from '../util'

import { Variable } from './Variable'

export function Variables({ simulation }) {
	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState({})
	const flipExpand = (id) => setExpanded(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Define the order of the variables.
	const { variables } = simulation
	const [order, setOrder] = useState([])
	const updateOrder = useCallback(() => {
		setOrder(Object.keys(variables).sort((v1Key, v2Key) => {
			const v1 = variables[v1Key], v2 = variables[v2Key]
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

	// Set up a handler to create a new variable and open it on entry.
	const addVariable = async () => {
		const ref = getVariableRef(simulation.id)
		setExpanded(expanded => ({ ...expanded, [ref.id]: true }))
		return await setDoc(ref, {})
	}

	// If there are no variables, show an introduction.
	if (Object.keys(simulation.variables).length === 0)
		return <VariablesIntroduction addVariable={addVariable} />

	// Render the questions through an Accordion.
	return <FormPart>
		{order.map((variableId, index) => <Variable key={variableId} {...{ simulation, variable: simulation.variables[variableId], index, expanded: !!expanded[variableId], flipExpand: () => flipExpand(variableId) }} />)}
		<Accordion sx={accordionStyle} onClick={addVariable} expanded={false}>
			<AccordionSummary>
				<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
			</AccordionSummary>
		</Accordion>
	</FormPart>
}

function VariablesIntroduction({ addVariable }) {
	return <>
		<p>Eine Parameter ist eine Zahl, die angepasst wird, während der Benutzer das Spiel spielt. Sie kann eine beliebige Größe sein, wie Geld,  Zufriedenheit oder Lebenspunkte.</p>
		<p>Um Parameter zu verwenden, müssen sie zunächst hier definiert werden. Dann kann für jede Frage oder Antwortmoglichkeit angegeben werden, wie sie angepasst werden sollen.</p>
		<FormPart>
			<AddVariable addVariable={addVariable} />
		</FormPart>
	</>
}

function AddVariable({ addVariable }) {
	return <Accordion sx={accordionStyle} onClick={addVariable} expanded={false}>
		<AccordionSummary>
			<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
		</AccordionSummary>
	</Accordion>
}
