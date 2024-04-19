import { useState, useCallback, useEffect } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { setDoc, deleteField, arrayUnion } from 'firebase/firestore'

import { FormPart } from '../../../components'
import { updateSimulation, getVariableRef } from '../../../simulations'

import { accordionStyle } from './util'

export function Variables({ simulation }) {
	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState({})
	const flipExpand = (id) => setExpanded(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Define the order of the variables.
	const { variables } = simulation
	const [order, setOrder] = useState()
	const updateOrder = useCallback(() => {
		setOrder(Object.keys(variables)) // ToDo: implement sorting.
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

	return <>
		<p>Variables can be changed here.</p>
		<p>ToDo: set up Variable component to be implemented.</p>
		<p>{JSON.stringify(variables)}</p>
	</>
}

function VariablesIntroduction({ addVariable }) {
	return <>
		<p>Eine Variable ist eine Zahl, die angepasst wird, während der Benutzer das Spiel spielt. Sie kann eine beliebige Größe sein, wie Geld,  Zufriedenheit oder Lebenspunkte.</p>
		<p>Um Variablen zu verwenden, müssen sie zunächst hier definiert werden. Dann kann für jede Frage oder Antwortmoglichkeit angegeben werden, wie sie angepasst werden sollen.</p>
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
