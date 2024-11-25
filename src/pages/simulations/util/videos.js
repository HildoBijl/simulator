const videoRegEx = /((<iframe.*src=")([^"]*)(".*)(allow="autoplay")?(.*)(><\/iframe>))|((<iframe.*src=")(.*)(".*)(allow="autoplay")?(.*)(\/>))/
const videoRegExParts = [1, 8] // The indices of the encompassing groups.

// hasVideo returns whether a page description (or other TinyMCE source code) has a video.
export function hasVideo(description = '') {
	return !!description.match(videoRegEx)
}

// applyAutoplay takes a page description (or other piece of TinyMCE source code) and ensures that autoplay is on for the first video in the description.
export function applyAutoplay(description = '') {
	// Check if there is a video iFrame.
	const match = description.match(videoRegEx)
	if (!match)
		return description
	const part = videoRegExParts.find(part => !!match[part])
	if (part === undefined)
		return description

	// Extract important parameters.
	const url = match[part + 2]
	const hasAutoplayInURL = url.includes('autoplay=1')
	const hasAutoplayInTag = !!match[part + 4]
	const urlWithAutoplay = hasAutoplayInURL ? url : (`${url}${url.match(/.*\?.*=.*/) ? '&' : '?'}autoplay=1`)

	// Set up the new description.
	const updatedTag = `${match[part + 1]}${urlWithAutoplay}${match[part + 3]}${hasAutoplayInTag ? '' : ' allow="autoplay"'}${match[part + 5]}${match[part + 6]}`
	return description.replace(videoRegEx, updatedTag)
}
