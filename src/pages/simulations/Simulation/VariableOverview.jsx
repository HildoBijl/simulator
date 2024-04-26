import { useTheme, alpha } from '@mui/material/styles'

import { applyMapping } from '../../../util'

export function VariableOverview({ simulation, state, showHidden = false }) {
	// Determine the variables to show and their values.
	const variables = applyMapping(simulation.variables, variable => {
		if (!showHidden && variable.hidden)
			return
		return { ...variable, value: state.variableValues[variable.id] }
	})

	// On no variables, do not show anything.
	if (Object.keys(variables).length === 0)
		return null

	// Show the variables.
	return <div style={{ display: 'flex', flexFlow: 'row wrap' }}>
		{Object.values(variables)
			.sort((a, b) => a.title < b.title ? -1 : 1)
			.map(variable => <Variable key={variable.id} {...variable} />)}
	</div>
}

export function Variable({ title, min, max, value }) {
	const theme = useTheme()

	return <div style={{
		alignItems: 'center', display: 'flex', flexFlow: 'column nowrap', // Positioning.
		margin: '0.5rem 0.5rem', padding: '0.8rem 0.4rem 0.5rem', width: '12rem', // Sizing.
		background: alpha(theme.palette.primary.main, 0.1), borderRadius: '1rem', // Coloring.
	}}>
		<div style={{
			borderRadius: '3.5rem', height: '7rem', width: '7rem', // Sizing.
			background: theme.palette.primary.main, color: theme.palette.primary.contrastText, // Coloring.
			display: 'flex', alignItems: 'center', justifyContent: 'center', // Content positioning.
			fontSize: '2rem', fontWeight: '500', // Content styling.
		}}>
			{value.toString().replace('.', ',')}
		</div>
		<div style={{
			marginTop: '0.2rem', width: '100%', // Sizing.
			fontSize: '1.2rem', fontWeight: '500', textAlign: 'center', // Text formatting.
		}}>
			{title}
		</div>
	</div>
}
