import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import { setDoc } from 'firebase/firestore'

import { FormPart, Label, Code } from 'components'
import { getEventRef } from 'simulations'

import { accordionStyle } from '../../settings'

import { Event } from './Event'

export function Events({ simulation }) {
	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState({})
	const flipExpand = (id) => setExpanded(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Define the order of the events.
	const { events } = simulation
	const [order, setOrder] = useState([])
	const updateOrder = useCallback(() => {
		setOrder(Object.keys(events).sort((key1, key2) => events[key1].title > events[key2].title ? 1 : -1))
	}, [setOrder, events])
	useEffect(() => updateOrder(), [updateOrder, events])

	// Set up a handler to create a new event and open it on entry. Ensure, on a clone, that it has no ID set.
	const addEvent = async (initialValue = {}) => {
		const ref = getEventRef(simulation.id)
		setExpanded(expanded => ({ ...expanded, [ref.id]: true }))
		return await setDoc(ref, initialValue)
	}

	// duplicateEvent takes an event and creates a copy of it, storing it in the database.
	const duplicateEvent = async (eventId) => {
		flipExpand(eventId) // First close the current event.
		const newEvent = { ...events[eventId] }
		delete newEvent.id
		return await addEvent(newEvent) // Then add the new one.
	}

	// If there are no events, show an introduction.
	if (Object.keys(simulation.events).length === 0)
		return <EventsIntroduction addEvent={addEvent} />

	// Render the events through an Accordion.
	return <FormPart>
		<Label>Ereignisse</Label>
		{order.map((eventId, index) => <Event key={eventId} {...{ simulation, event: events[eventId], index, expanded: !!expanded[eventId], flipExpand: () => flipExpand(eventId), duplicate: () => duplicateEvent(eventId) }} />)}
		<Accordion sx={accordionStyle} onClick={() => addEvent()} expanded={false}>
			<AccordionSummary>
				<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
			</AccordionSummary>
		</Accordion>
	</FormPart>
}

function EventsIntroduction({ addEvent }) {
	return <>
		<Alert severity="info" sx={{ my: 2 }}>
			<p style={{ marginTop: 0 }}>Ein Ereignis ist eine besondere Situation, die eintritt, wenn eine bestimmte Bedingung erfüllt ist.</p>
			<p style={{ marginBottom: 0 }}>Ein Ereignis hat eine Bedingung (Auslöser) wie &quot;<Code>hp &gt; 10 &amp; &amp; geld &lt;= 20</Code>&quot;. Wenn (beim Verlassen einer Seite) diese Bedingung erfüllt ist, wird dem Benutzer eine bestimmte neue Seite angezeigt, unabhängig von der Seite, die wir normalerweise aufrufen würden.</p>
			<p>Ereignisse können nur einmal pro Simulationslauf ausgelöst werden. Wenn mehrere Ereignisse gleichzeitig eintreten, wird eines davon willkürlich ausgewählt. Weitere Einzelheiten zu Ereignissen finden Sie in der <Link to="/create/documentation" target="_blank">allgemeinen Dokumentation</Link>.</p>
		</Alert>
		<FormPart>
			<AddEvent addEvent={addEvent} />
		</FormPart>
	</>
}

function AddEvent({ addEvent }) {
	return <Accordion sx={accordionStyle} onClick={() => addEvent()} expanded={false}>
		<AccordionSummary>
			<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
		</AccordionSummary>
	</Accordion>
}
