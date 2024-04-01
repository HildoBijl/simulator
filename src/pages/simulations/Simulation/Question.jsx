import Button from '@mui/material/Button'

import { Page, InputParagraph, Media } from '../../../components'

export function Question({ simulation, question, goToQuestion }) {
	// Set up a handler to go to the next question.
	const goToNextQuestion = () => goToQuestion(question.followUpQuestion || simulation.questionOrder[simulation.questionOrder.indexOf(question.id) + 1] || 'end')

	return <Page title={question.title || simulation.title || '[Simulationstitel fehlt]'}>
		<InputParagraph>{question.description}</InputParagraph>
		<Media media={question.media} />
		<Button variant="contained" sx={{ margin: '1rem 0' }} onClick={() => goToNextQuestion()}>Frage beantworten/abschließen</Button>
	</Page>
}
