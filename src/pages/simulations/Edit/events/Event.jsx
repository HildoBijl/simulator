import { useCallback } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { deleteField } from 'firebase/firestore'

import { FormPart, TrackedTextField, TrackedCodeField } from 'components'
import { updateEvent, deleteEvent, pageIndexToString } from 'simulations'

import { emptyPage, emptyEventTitle, defaultAfterwards, accordionStyle } from '../../settings'
import { getConditionError } from '../../scripts'

export function Event({ simulation, event, expanded, flipExpand, duplicate }) {
	// On a deleted event, don't display anything.
	if (!event)
		return null

	// Render the Event.
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{event.title || emptyEventTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TrackedTextField label="Titel (nur zur internen Verwendung)" value={event.title} path={`simulations/${simulation.id}/events`} documentId={event.id} field="title" />
			</FormPart>
			<ConditionField simulation={simulation} event={event} />
			<PageDropdown simulation={simulation} event={event} />
			<AfterwardsSetting simulation={simulation} event={event} />
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={duplicate}>Duplizieren</Button>
			<Button onClick={() => deleteEvent(simulation, event)}>Löschen</Button>
		</AccordionActions>
	</Accordion >
}

function ConditionField({ simulation, event }) {
	// Set up an error detection function for the condition code field.
	const getError = useCallback((condition) => getConditionError(condition, simulation), [simulation])

	// Render the field.
	return <FormPart>
		<TrackedCodeField label="Bedingung (z. B. 'leben < 0 || geld >= 20')" value={event.condition} path={`simulations/${simulation.id}/events`} documentId={event.id} field="condition" getError={getError} />
	</FormPart>
}

function PageDropdown({ simulation, event }) {
	// Set up a handler to save the page.
	const setPage = (pageId) => updateEvent(simulation.id, event.id, { page: pageId })

	// Render the dropdown field.
	const label = 'Seite, zu der gesprungen werden soll'
	const value = event.page || simulation.pageList[0].id
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setPage(event.target.value)}>
				{simulation.pageList.map(page => <MenuItem key={page.id} value={page.id}>{pageIndexToString(page.index)} {page.title || emptyPage}</MenuItem>)}
			</Select>
		</FormControl>
	</FormPart>
}

function AfterwardsSetting({ simulation, event }) {
	// Set up a handler to save the setting.
	const saveAfterwardsSettings = (afterwards) => updateEvent(simulation.id, event.id, { afterwards: afterwards === defaultAfterwards ? deleteField() : afterwards })

	// Show the radio control group.
	const value = event.afterwards || defaultAfterwards
	return <FormPart>
		<FormControl fullWidth>
			<RadioGroup value={value} onChange={(event) => saveAfterwardsSettings(event.target.value)}>
				<FormControlLabel value="originalFollowUp" control={<Radio />} label="Danach zurück zur ursprünglichen Sequenz springen. (Die Folgeseite des Ereignisszenarios wird ignoriert.)" />
				<FormControlLabel value="eventFollowUp" control={<Radio />} label="Danach zur Seite springen, die in der Ereignisseite angegeben ist. (Die ursprüngliche Folgeseite wird ignoriert.)" />
			</RadioGroup>
		</FormControl>
	</FormPart>
}
