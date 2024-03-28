import { Fragment } from 'react'

export function InputParagraph({ children: text, fallback }) {
	// On no text, use the fallback.
	if (!text) {
		if (!fallback)
			return null
		if (typeof fallback === 'string')
			return <p>{fallback}</p>
		return fallback
	}

	// Ensure that we have received a string.
	if (typeof text !== 'string')
		throw new Error(`Invalid InputParagraph input: expected a string, but received something of type "${typeof text}".`)

	// Process and display the text.
	return text.replace(/\n\n+/g, '\n\n').split('\n\n').map((paragraph, index) => {
		const paragraphSplit = paragraph.split('\n')
		return <p key={index}>
			{paragraphSplit.map((subParagraph, subIndex) => <Fragment key={subIndex}>{subParagraph}{subIndex < paragraphSplit.length - 1 ? <br /> : null}</Fragment>)}
		</p>
	})
}
