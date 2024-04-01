import { useState } from 'react'
import { useTheme, darken } from '@mui/material/styles'
import Button from '@mui/material/Button'

import { numberToLetter } from '../../../util'
import { Page, InputParagraph, Media } from '../../../components'

import { emptyOption } from '../Edit'

export function Question({ simulation, question, goToQuestion }) {
	const [selection, setSelection] = useState()

	// Set up a handler to go to the next question.
	const goToNextQuestion = () => goToQuestion(question.followUpQuestion || simulation.questionOrder[simulation.questionOrder.indexOf(question.id) + 1] || 'end')
	const options = question.options || []

	return <Page title={question.title || simulation.title || '[Simulationstitel fehlt]'}>
		<InputParagraph>{question.description}</InputParagraph>
		<Media media={question.media} />
		{options.length === 0 ? <>
			<Button variant="contained" sx={{ margin: '1rem 0' }} onClick={() => goToNextQuestion()}>Weiter</Button>
		</> : <>
			<div style={{ alignItems: 'stretch', display: 'flex', flexFlow: 'column nowrap', margin: '1rem 0' }}>
				{question.options.map((option, index) => <Option key={index} {...{ simulation, question, option, index, selected: index === selection, select: () => setSelection(index) }} />)}
			</div>
			<Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => goToNextQuestion()}>Wahl bestätigen</Button>
		</>}
	</Page>
}

function Option({ option, index, selected, select }) {
	const [isHovered, setIsHovered] = useState(false)
	const theme = useTheme()
	const letter = numberToLetter(index)
	const description = option.description || emptyOption

	// Set up handlers for interaction functionalities.
	const handlers = {
		onClick: () => select(),
		onMouseEnter: () => setIsHovered(true),
		onMouseLeave: () => setIsHovered(false),
	}

	// Define styles for the various elements.
	const commonStyle = {
		background: (selected ? darken(theme.palette.primary.main, 0.25) : (isHovered ? darken(theme.palette.primary.main, 0.15) : darken(theme.palette.primary.main, 0))),
		borderRadius: '1.5rem',
		color: theme.palette.primary.contrastText,
		cursor: selected ? 'default' : 'pointer',
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
		padding: '0 0.75rem',
	}

	// Render the option.
	return <div style={{ alignItems: 'flex-start', display: 'flex', flexFlow: 'row nowrap', margin: '0.25rem 0' }}>
		<div style={letterStyle} {...handlers}>{letter.toUpperCase()}</div>
		<div style={descriptionStyle} {...handlers}>
			<InputParagraph>{description}</InputParagraph>
		</div>
	</div>
}
