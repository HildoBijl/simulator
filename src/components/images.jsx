import { useState, useEffect, useRef } from 'react'

import { useStorageUrl } from '../firebase'

export function InternalImage({ path, extraUpdateParameter, style = {} }) {
	const url = useStorageUrl(path, extraUpdateParameter)
	if (!url)
		return null
	return <img src={url} style={style} />
}

export function ExternalImage({ path, style = {} }) {
	// When the image loads or fails to load, update the validity setting.
	const [valid, setValid] = useState(false)
	const ref = useRef()
	useEffect(() => {
		let active = true
		if (ref.current) {
			ref.current.onerror = () => active && setValid(false)
			ref.current.onload = () => active && setValid(true)
		}
		return () => { active = false }
	})

	// Show the picture, but only if it's valid.
	return <img ref={ref} src={path} style={{ ...style, display: valid ? (style.display || 'block') : 'none' }} />
}
