import { useState } from 'react'
import { useTheme, darken } from '@mui/material/styles'
import Button from '@mui/material/Button'

import { numberToLetter } from '../../../util'
import { Page, InputParagraph, Media } from '../../../components'

import { emptyOption } from '../Edit'

export function Question({ simulation, question, goToQuestion }) {
	const [selection, setSelection] = useState()
	const [confirmed, setConfirmed] = useState(false)

	// Set up a handler to go to the next question. This is either the option follow-up, if it is defined, or otherwise the question follow-up.
	const options = question.options || []
	const confirmChoice = () => setConfirmed(true)
	const goToNextQuestion = () => {
		if (selection !== undefined && options[selection] && options[selection].followUpQuestion)
			return goToQuestion(options[selection].followUpQuestion)
		return goToQuestion(question.followUpQuestion || simulation.questionOrder[simulation.questionOrder.indexOf(question.id) + 1] || 'end')
	}

	// Render the question with description, media, options and buttons.
	return <Page title={question.title || simulation.title || '[Simulationstitel fehlt]'}>
		<InputParagraph>{question.description}</InputParagraph>
		<Media media={question.media} />
		{options.length === 0 ? null : <>
			<div style={{ alignItems: 'stretch', display: 'flex', flexFlow: 'column nowrap', margin: '1rem 0' }}>
				{question.options.map((option, index) => confirmed ?
					<Option key={index} {...{ simulation, question, option, index, disabled: index !== selection, feedback: index === selection && 'Feedback! ToDo' }} /> :
					<Option key={index} {...{ simulation, question, option, index, selected: index === selection, select: () => setSelection(index), deselect: () => setSelection(undefined) }} />)}
			</div>
		</>}
		{options.length === 0 || confirmed ?
			<Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => goToNextQuestion()}>Weiter</Button> :
			<Button variant="contained" sx={{ margin: '0 0 1rem 0' }} disabled={selection === undefined} onClick={() => confirmChoice()}>Wahl bestätigen</Button>}
	</Page>
}

function Option({ option, index, selected, select, deselect, disabled }) {
	const [isHovered, setIsHovered] = useState(false)
	const theme = useTheme()
	const letter = numberToLetter(index)
	const description = option.description || emptyOption

	// Set up handlers for interaction functionalities.
	const handlers = {
		onClick: () => selected ? deselect() : select(),
		onMouseEnter: () => setIsHovered(true),
		onMouseLeave: () => setIsHovered(false),
	}

	// Define styles for the various elements.
	const commonStyle = {
		background: disabled ? (theme.palette.mode === 'light' ? '#bbb' : '#444') : (selected ? darken(theme.palette.primary.main, 0.25) : (isHovered && select ? darken(theme.palette.primary.main, 0.15) : darken(theme.palette.primary.main, 0))),
		borderRadius: '1.5rem',
		color: disabled ? darken(theme.palette.primary.contrastText, 0.5) : theme.palette.primary.contrastText,
		cursor: (select ? 'pointer' : 'default'),
	}
	const letterStyle = {
		...commonStyle,
		flex: '0 0 auto',
		fontSize: '1.5rem',
		fontWeight: 500,
		height: '3rem',
		lineHeight: '2.8rem',
		marginRight: '0.5rem',
		textAlign: 'center',
		width: '3rem',
	}
	const descriptionStyle = {
		...commonStyle,
		flex: '1 1 auto',
		padding: '0 1rem',
	}

	// Render the option.
	return <div style={{ alignItems: 'flex-start', display: 'flex', flexFlow: 'row nowrap', margin: '0.25rem 0' }}>
		<div style={letterStyle} {...handlers}>{letter.toUpperCase()}</div>
		<div style={descriptionStyle} {...handlers}>
			<InputParagraph>{description}</InputParagraph>
		</div>
	</div>
}
