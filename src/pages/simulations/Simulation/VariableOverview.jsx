import { useTheme, alpha } from '@mui/material/styles'

import { bound, roundToDigits, getTickSize, range, applyMapping } from '../../../util'

export function VariableOverview({ simulation, state, showHidden = false }) {
	// Determine the variables to show and their values.
	const variables = applyMapping(simulation.variables, variable => {
		if (!showHidden && variable.hidden)
			return
		return { ...variable, value: state.variables[variable.id] }
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

function Variable({ title, value, min, max }) {
	const theme = useTheme()

	// Set up a few settings.
	const size = 7 // rem
	const radius = 50 // pixels in SVG, for the outer radius
	const thickness = 10 // pixels in SVG
	const tickLength = thickness // pixels in SVG
	const split = 0.2 // The part of the circle in the bottom, that's unused.

	// Determine whether to show the markers or not.
	const showMarkers = (min !== undefined && max !== undefined && min < max && min <= value && value <= max)

	// On markers, calculate relevant quantities.
	let part, dash1, dash2, ticks
	if (showMarkers) {
		part = bound((value - min) / (max - min))
		const circumference = 2 * Math.PI * (radius - thickness / 2)
		dash1 = part * (1 - split) * circumference
		dash2 = circumference - dash1
		const tickSize = getTickSize(max - min)
		ticks = range(Math.ceil(min / tickSize), Math.floor(max / tickSize)).map(value => value * tickSize)
	}

	return <div style={{
		alignItems: 'center', display: 'flex', flexFlow: 'column nowrap', // Positioning.
		margin: '0.5rem 0.5rem', padding: '0.8rem 0.4rem 0.5rem', width: '12rem', // Sizing.
		background: alpha(theme.palette.primary.main, 0.1), borderRadius: '1rem', // Coloring.
	}}>
		<div style={{ display: 'block', height: `${size}rem`, width: `${size}rem` }}>
			<svg style={{
				position: 'absolute', zIndex: 1,
				width: `${size}rem`, height: `${size}rem`
			}} viewBox="-50 -50 100 100">
				<circle cx="0" cy="0" r={radius - (showMarkers ? thickness : 0)} style={{ fill: theme.palette.primary.main }} />
				{showMarkers ? <>
					<circle cx="0" cy="0" r={radius - thickness / 2} style={{ strokeWidth: thickness, stroke: theme.palette.success.main, fill: 'none', strokeDasharray: `${dash1} ${dash2}`, transform: `rotate(${(0.25 + split / 2) * 360}deg)` }} />
					<RadialLine part={split / 2} startRadius={radius - thickness} endRadius={radius - thickness + tickLength * 1.5} />
					<RadialLine part={1 - split / 2} startRadius={radius - thickness} endRadius={radius - thickness + tickLength * 1.5} />
					{ticks.map((tick, index) => <RadialLine key={index} part={split / 2 + (tick - min) / (max - min) * (1 - split)} startRadius={radius - thickness} endRadius={radius - thickness + tickLength} />)}
				</> : null}
			</svg>
			<div style={{
				borderRadius: '3.5rem', height: `${size}rem`, width: `${size}rem`, // Sizing.
				position: 'absolute', zIndex: 2,
				// background: theme.palette.primary.main,
				color: theme.palette.primary.contrastText, // Coloring.
				display: 'flex', alignItems: 'center', justifyContent: 'center', // Content positioning.
				fontSize: '2rem', fontWeight: '500', // Content styling.
			}}>
				{roundToDigits(value, 3, true).toString().replace('.', ',')}
			</div>
		</div>
		<div style={{
			marginTop: '0.2rem', width: '100%', // Sizing.
			fontSize: '1.2rem', fontWeight: '500', textAlign: 'center', // Text formatting.
		}}>
			{title}
		</div>
	</div>
}

export function RadialLine({ part, startRadius, endRadius }) {
	const theme = useTheme()
	return <line
		x1={-startRadius * Math.sin(part * 2 * Math.PI)}
		y1={startRadius * Math.cos(part * 2 * Math.PI)}
		x2={-endRadius * Math.sin(part * 2 * Math.PI)}
		y2={endRadius * Math.cos(part * 2 * Math.PI)}
		style={{ stroke: theme.palette.text.primary, strokeWidth: 1 }}
	/>
}
