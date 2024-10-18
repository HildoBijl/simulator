import { useState, useEffect } from 'react'
import { useTheme, darken } from '@mui/material/styles'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { Undo } from '@mui/icons-material'

import { numberToLetter } from 'util'
import { Page, InputParagraph, MCEContents } from 'components'
import { useIsOwner, questionIndexToString } from 'simulations'

import { emptyQuestion, emptyOption } from '../../settings'

import { VariableOverview } from '../components/VariableOverview'

export function Question({ simulation, history, state, chooseOption, goToNextQuestion, jumpToQuestion, reset, undo }) {
	const isOwner = useIsOwner(simulation)
	const { pageId, choice } = state

	// Determine the question we're at.
	const question = simulation.questions[pageId]
	const options = question.options || []

	// If an option has been chosen and there's no feedback, automatically continue to the next question.
	useEffect(() => {
		const options = question.options || []
		if (choice === undefined)
			return // Question isn't done yet. Can't auto-continue.
		if (!question.options)
			return // No options. Never auto-continue, since it's an info-screen.
		if (options[choice].feedback || question.feedback)
			return // There's feedback to show. Don't auto-continue.
		goToNextQuestion(isOwner) // No reason found not to: let's auto-continue!
	}, [question, choice, goToNextQuestion, isOwner])

	// Check what kind of button to show.
	const showRestartButton = options.length === 0 && question.followUpQuestion === 'end'
	const showNextButton = !showRestartButton && (options.length === 0 || choice !== undefined)

	// Define what icons to show.
	const canUndo = history.length > 1 || state.choice !== undefined
	const icons = simulation.allowUndo && canUndo ? [{ Icon: Undo, onClick: undo }] : []

	// Render the question with description, media, options and buttons.
	return <Page title={question.title || simulation.title || '[Simulationstitel fehlt]'} showLogo="right" icons={icons}>
		<MCEContents>{question.description}</MCEContents>
		{options.length === 0 ? null : <>
			<div style={{ alignItems: 'stretch', display: 'flex', flexFlow: 'column nowrap', margin: '1rem 0' }}>
				{question.options.map((option, index) => choice !== undefined ?
					<Option key={index} {...{ simulation, question, option, index, disabled: index !== choice, feedback: index === choice && (options[choice].feedback || question.feedback) }} /> :
					<Option key={index} {...{ simulation, question, option, index, selected: false, select: () => chooseOption(index, isOwner) }} />)}
			</div>
		</>}
		{showRestartButton ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => reset(isOwner)}>Neu starten</Button> : null}
		{showNextButton ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => goToNextQuestion(isOwner)}>Weiter</Button> : null}
		<VariableOverview {...{ simulation, state }} />
		<AdminTool {...{ simulation, state, jumpToQuestion, reset }} />
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
				<MCEContents>{description}</MCEContents>
			</div>
		</div>
		{feedback ? <div style={feedbackStyle}><InputParagraph>{feedback}</InputParagraph></div> : null}
	</>
}

function AdminTool({ simulation, state, jumpToQuestion, reset }) {
	const isOwner = useIsOwner(simulation)
	if (!isOwner)
		return null // Only show the tool for owners.
	return <>
		<h4>Ersteller-Tools</h4>
		<JumpDropDown {...{ simulation, state, jumpToQuestion }} />
		<Button variant="contained" sx={{ margin: '1rem 0 0 0' }} onClick={() => reset(isOwner)}>Neu starten</Button>
	</>
}

function JumpDropDown({ simulation, state, jumpToQuestion }) {
	const label = 'Zur Seite springen'
	const value = state.pageId
	return <FormControl fullWidth>
		<InputLabel>{label}</InputLabel>
		<Select value={value} label={label} onChange={(event) => jumpToQuestion(event.target.value)}>
			{simulation.questionList.map(question => <MenuItem key={question.id} value={question.id}>{questionIndexToString(question.index)} {question.title || emptyQuestion}</MenuItem>)}
			<MenuItem key="end" value="end">Ende: den Durchlauf beenden</MenuItem>
		</Select>
	</FormControl>
}
