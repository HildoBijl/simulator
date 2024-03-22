import { useState, useEffect } from 'react'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'

import { app } from './main'

export const storage = getStorage(app)

// useStorageUrl takes a path of a file in Firebase storage and gives the corresponding DownloadUrl. This is updated asynchronously, so on the first render it will be undefined. Optionally, an extra updateParameter can be given which, upon changing, will cause a reload.
export function useStorageUrl(path, extraUpdateParameter) {
	const [url, setUrl] = useState()
	useEffect(() => {
		let active = true
		if (path) {
			const storageRef = ref(storage, path)
			getDownloadURL(storageRef).then(url => active && setUrl(url))
		} else {
			setUrl(undefined)
		}
		return () => { active = false }
	}, [path, extraUpdateParameter])
	return url
}
