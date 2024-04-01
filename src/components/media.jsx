import { useState, useEffect, useRef } from 'react'

import { useStorageUrl } from '../firebase'

export function Media({ media, height = 480 }) {
	// On no media, do not display anything.
	if (!media)
		return null

	// Depending on the type of media, render the appropriate component.
	const imageStyle = { maxHeight: `${height}px`, maxWidth: '100%', display: 'block' }
	const { type } = media
	switch (type) {
		case 'internalImage':
			return <InternalImage path={media.path} style={imageStyle} />
		case 'externalImage':
			return <ExternalImage path={media.path} style={imageStyle} />
		case 'youtubeVideo':
			return <YouTubeVideo id={media.id} height={height} />
		default:
			throw new Error(`Invalid media type: encountered a type "${type}" but this is not among the available options.`)
	}
}

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

export function YouTubeVideo({ id, height = 400, width = height * 1.5 }) {
	if (!id)
		return null
	return <div className="video-responsive">
		<iframe style={{ height, width, maxHeight: `60vw`, maxWidth: '100%' }} src={`https://www.youtube.com/embed/${id}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Embedded YouTube" />
	</div>
}
