export function FormPart({ children }) {
	return <div style={{ margin: '1.4rem 0' }}>{children}</div>
}

export function FormSubPart({ children }) {
	return <div style={{ margin: '0.9rem 0' }}>{children}</div>
}

export function Code({ children }) {
	return <span style={{ fontFamily: "Consolas, 'Courier New', monospace" }}>{children}</span>
}
