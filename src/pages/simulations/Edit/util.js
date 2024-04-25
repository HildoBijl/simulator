export const accordionStyle = { background: '#181818', '@media (prefers-color-scheme: light)': { background: '#fbfbfb' } }
export const emptyQuestion = '[Fragentitel fehlt]'
export const emptyOption = '[Optionsbeschreibung fehlt]'
export const emptyVariableName = '[Kein Name]'
export const emptyVariableTitle = '[Kein Titel]'
export const fixNumber = str => str.replace(/[^0-9.-]/, '') // Remove unwanted sybols.
	.replace(/(\..*)\./, (_, a) => a) // Remove a second period.
	.replace(/(.*)-(.*)-(.*)/, (_, a, b, c) => a + b + c) // Remove two minus signs.
	.replace(/(.*)-(.*)/, (_, a, b) => '-' + a + b) // Move a single minus sign forward.
export const strToNumber = str => str === '' ? undefined : str === '-' ? 0 : Number(str)