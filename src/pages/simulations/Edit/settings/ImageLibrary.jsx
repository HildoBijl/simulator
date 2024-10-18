import { useState, useMemo } from 'react'
import { useTheme, alpha } from '@mui/material/styles'
import Button from '@mui/material/Button'
import { arrayRemove, arrayUnion } from 'firebase/firestore'
import { ref, uploadBytesResumable } from 'firebase/storage'

import { fileSizeText } from 'util'
import { storage, useStorageUrl } from 'fb'
import { FormPart, FormSubPart } from 'components'
import { updateSimulation } from 'simulations'

export function ImageLibrary({ simulation }) {
	return <>
		<h2>Bilddatenbank</h2>
		<p>Sie können Bilder über ihre URL zu Simulationsseiten hinzufügen. Das Hinzufügen von Bildern, die bereits online sind, ist daher einfach. Ist Ihr Bild noch nicht online? Dann laden Sie es hier in Ihre eigene Bildbibliothek hoch, um eine URL zu erhalten.</p>
		<CurrentImages {...{ simulation }} />
		<ImageUploader {...{ simulation }} />
	</>
}

function CurrentImages({ simulation }) {
	const { images } = simulation
	const imagesSorted = useMemo(() => images.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0), [images]) // Sort alphabetically by filename.
	return <div style={{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'flex-start', alignItems: 'stretch' }}>
		{imagesSorted.map(image => <Image key={image.name} {...{ simulation, image }} />)}
	</div>
}

const width = 140, heightImage = 120, heightLabel = 24
function Image({ simulation, image }) {
	const theme = useTheme()
	const url = useStorageUrl(`simulations/${simulation.id}/images/${image.name}`)
	return <div style={{ background: alpha(theme.palette.primary.main, 0.05), display: 'flex', flexFlow: 'column nowrap', margin: '4px', borderRadius: '8px', alignItems: 'center' }}>
		<div style={{ width: `${width}px`, height: `${heightImage}px`, boxSizing: 'content-box', padding: '8px', display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center' }}>
			{url ? <img src={url} style={{ maxWidth: `${width}px`, maxHeight: `${heightImage}px` }} /> : null}
		</div>
		<div style={{ fontSize: '10px', width: `${width}px`, height: `${heightLabel}px`, boxSizing: 'content-box', padding: '4px', display: 'flex', flexFlow: 'column nowrap', alignItems: 'center', justifyContent: 'center' }}>
			<div style={{ textAlign: 'center' }}>
				<span style={{}}>{image.name}</span> <span style={{ opacity: 0.6 }}>({fileSizeText(image.size)})</span>
			</div>
		</div>
	</div>
}

const maxFileSize = 2 // MB
function ImageUploader({ simulation }) {
	const theme = useTheme()
	const [file, setFile] = useState()
	const [percentage, setPercentage] = useState()

	const setAndSaveFile = async (event) => {
		// Set the file locally.
		const file = event.target.files[0]
		setFile(file)
		if (file.size > maxFileSize * 1024 ** 2)
			return

		// Start uploading the new file.
		const fileName = file.name
		const filePath = `simulations/${simulation.id}/images/${fileName}`
		const storageRef = ref(storage, filePath)
		const uploadTask = uploadBytesResumable(storageRef, file)

		// Check if a file with that name was already in the image bank.
		const simulationImages = simulation.images || []
		const existingFileIndex = simulationImages.findIndex(image => image.fileName === fileName)
		const existingFile = simulationImages[existingFileIndex]

		// Keep track of upload updates.
		uploadTask.on('state_changed',
			snapshot => { // On change in upload percentage.
				setPercentage(Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 100)
			},
			error => { // On error.
				console.error(error)
				if (existingFile) // Delete any potential existing file.
					updateSimulation(simulation.id, { images: arrayRemove(existingFile) })
				// ToDo: remove media.
				// ToDo: check if on overwrite link is maintained.
			},
			async () => { // On finished uploading.
				console.log('Complete! Store data about the image.', file)
				const imageData = { name: file.name, size: file.size }
				if (existingFileIndex !== -1) {
					const images = [...simulationImages]
					images[existingFileIndex] = imageData
					await updateSimulation(simulation.id, { images })
				} else {
					await updateSimulation(simulation.id, { images: arrayUnion(imageData) })
				}
				setFile(undefined)
			})
	}

	// When a file is selected, show an upload notification, or an error if there's a problem.
	if (file) {
		if (file.size > maxFileSize * 1024 ** 2) { // File too large?
			return <>
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Die Datei ist zu groß. Die maximale Dateigröße beträgt {maxFileSize} MB, aber die angegebene Datei ist {Math.round(file.size / 1024 ** 2 * 10) / 10} MB groß.</p>
				<UploadButton onChange={setAndSaveFile} />
			</>
		}
		return <p>Das Bild wird gerade hochgeladen. Der Upload ist zu {percentage}% abgeschlossen.</p>
	}

	// When no file is selected, show (if present) the already existing image, together with an upload button.
	return <FormSubPart>
		<UploadButton onChange={setAndSaveFile} />
	</FormSubPart>
}

function UploadButton({ onChange }) {
	return <Button variant="contained" component="label">
		Neues Bild hochladen
		<input type="file" accept="image/*" onChange={onChange} hidden />
	</Button>
}
