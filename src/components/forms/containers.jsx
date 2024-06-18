import { useTheme } from '@mui/material/styles'

export function FormPart({ children }) {
	return <div style={{ margin: '1.4rem 0' }}>{children}</div>
}

export function FormSubPart({ children }) {
	return <div style={{ margin: '0.9rem 0' }}>{children}</div>
}

export function Code({ children }) {
	return <span style={{ fontFamily: "Consolas, 'Courier New', monospace" }}>{children}</span>
}

export function Label({ children }) {
	const theme=  useTheme()
	return <h5 style={{ color: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 400, margin: '-0.5rem 0 0 0.4rem' }}>{children}</h5>
}
