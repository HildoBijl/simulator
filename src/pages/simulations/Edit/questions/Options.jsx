import { useState, useEffect, useRef } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { arrayUnion, arrayRemove } from 'firebase/firestore'

import { numberToLetter } from '../../../../util'
import { TrackedTextField } from '../../../../components'
import { updateQuestion } from '../../../../simulations'

import { emptyOption } from './util'

export function Options({ simulation, question }) {
	// Set up manual expansion controls.
	const options = question.options || []
	const [expanded, setExpanded] = useState(options.map(() => false))
	const flipExpand = (index) => setExpanded(expanded => [...expanded.slice(0, index), !expanded[index], ...expanded.slice(index + 1)])

	// Set up an addOption handler that opens a new option upon entry.
	const canAddOption = !options.find(option => Object.keys(option).length === 0)
	const addOption = async () => {
		if (!canAddOption)
			return
		setExpanded(expanded => [...expanded, true])
		await updateQuestion(simulation.id, question.id, { options: arrayUnion({}) })
	}
	const removeOption = async (index) => {
		await updateQuestion(simulation.id, question.id, { options: arrayRemove(options[index]) })
		setExpanded(expanded => [...expanded.slice(0, index), ...expanded.slice(index + 1)])
	}

	// Render the options through an Accordion.
	return <>
		<h5 style={{ color: 'rgba(255,255,255,0.7)', '@media (prefersColorScheme: light)': { color: 'rgba(0,0,0,0.6)' }, fontSize: '0.9rem', fontWeight: 400, margin: '-0.5rem 0 0 0.4rem' }}>Antwortmöglichkeiten</h5>
		<div>
			{options.map((option, index) => <Option key={index} {...{ simulation, question, index, expanded: !!expanded[index], flipExpand: () => flipExpand(index), removeOption: () => removeOption(index) }} />)}
			{canAddOption ? <Accordion onClick={() => addOption()} expanded={false}>
				<AccordionSummary>
					<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
				</AccordionSummary>
			</Accordion> : null}
		</div>
	</>
}

function Option({ simulation, question, index, expanded, flipExpand }) {
	// Determine some derived/default properties.
	const option = question.options[index]
	const description = option.description || ''
	const title = description.split('\n')[0] || emptyOption

	// Add an effect to auto-focus the description field upon expanding.
	const descriptionRef = useRef()
	useEffect(() => {
		const field = descriptionRef.current
		if (expanded && field) {
			field.focus()
			field.setSelectionRange(field.value.length, field.value.length)
		}
	}, [expanded])

	// Render the option form.
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			<span style={{ marginRight: '0.75rem' }}>{numberToLetter(index).toUpperCase()}.</span>{title}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<TrackedTextField inputRef={descriptionRef} label="Beschreibung" value={option.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={index} arrayField="description" multiline={true} />
			{/* <FollowUpDropdown {...{ simulation, question }} /> */}
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={() => updateQuestion(simulation.id, question.id, { options: arrayRemove(option) })}>Löschen</Button>
		</AccordionActions>
	</Accordion>
}
