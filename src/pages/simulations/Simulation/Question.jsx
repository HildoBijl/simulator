import { useState } from 'react'
import { useTheme, darken } from '@mui/material/styles'
import Button from '@mui/material/Button'

import { numberToLetter } from '../../../util'
import { Page, InputParagraph, Media } from '../../../components'

import { emptyOption } from '../settings'

import { VariableOverview } from './VariableOverview'

export function Question({ simulation, state, chooseOption, goToNextQuestion }) {
	const { questionId, questionDone, choice } = state

	// Determine the question we're at.
	const question = simulation.questions[questionId]
	const options = question.options || []

	// Render the question with description, media, options and buttons.
	return <Page title={question.title || simulation.title || '[Simulationstitel fehlt]'}>
		<InputParagraph>{question.description}</InputParagraph>
		<Media media={question.media} />
		{options.length === 0 ? null : <>
			<div style={{ alignItems: 'stretch', display: 'flex', flexFlow: 'column nowrap', margin: '1rem 0' }}>
				{question.options.map((option, index) => questionDone ?
					<Option key={index} {...{ simulation, question, option, index, disabled: index !== choice, feedback: index === choice && (options[choice].feedback || question.feedback) }} /> :
					<Option key={index} {...{ simulation, question, option, index, selected: false, select: () => chooseOption(index) }} />)}
			</div>
		</>}
		{options.length === 0 || questionDone ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => goToNextQuestion()}>Weiter</Button> : null}
		<VariableOverview {...{ simulation, state }} />
	</Page>
}

function Option({ option, index, selected, select, deselect, disabled, feedback }) {
	const [isHovered, setIsHovered] = useState(false)
	const theme = useTheme()
	const letter = numberToLetter(index)
	const description = option.description || emptyOption

	// Set up handlers for interaction functionalities.
	const handlers = {
		onClick: () => selected ? deselect && deselect() : select && select(),
		onMouseEnter: () => setIsHovered(true),
		onMouseLeave: () => setIsHovered(false),
	}

	// Define styles for the various elements.
	const commonStyle = {
		background: disabled ? (theme.palette.mode === 'light' ? '#bbb' : '#444') : (selected ? darken(theme.palette.primary.main, 0.25) : (isHovered && select ? darken(theme.palette.primary.main, 0.15) : darken(theme.palette.primary.main, 0))),
		borderRadius: '1.5rem',
		color: disabled ? darken(theme.palette.primary.contrastText, 0.5) : theme.palette.primary.contrastText,
		cursor: (select ? 'pointer' : 'default'),
		WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)', // Don't show a blue rectangle on selecting.
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
	const feedbackStyle = {
		background: theme.palette.secondary.main,
		borderRadius: '1.5rem',
		color: theme.palette.secondary.contrastText,
		fontSize: '0.85rem',
		margin: '0rem 0 0.5rem 7rem',
		padding: '0 1rem',
	}

	// Render the option.
	return <>
		<div style={{ alignItems: 'flex-start', display: 'flex', flexFlow: 'row nowrap', margin: '0.25rem 0' }}>
			<div style={letterStyle} {...handlers}>{letter.toUpperCase()}</div>
			<div style={descriptionStyle} {...handlers}>
				<InputParagraph>{description}</InputParagraph>
			</div>
		</div>
		{feedback ? <div style={feedbackStyle}><InputParagraph>{feedback}</InputParagraph></div> : null}
	</>
}
