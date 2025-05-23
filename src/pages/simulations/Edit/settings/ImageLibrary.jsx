import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Snackbar from '@mui/material/Snackbar'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import { ContentCopy, Delete } from '@mui/icons-material'
import { arrayRemove, arrayUnion } from 'firebase/firestore'
import { ref, uploadBytesResumable } from 'firebase/storage'

import { fileSizeText } from 'util'
import { storage, useStorageUrl, deleteFile } from 'fb'
import { FormSubPart } from 'components'
import { updateSimulation } from 'simulations'

const maxFileSize = 0.5 * 1024 ** 2 // MB to bytes
const maxLibrarySize = 2 * 1024 ** 2 // MB to bytes

export function ImageLibrary({ simulation }) {
	return <>
		<h2>Bilddatenbank</h2>
		{(simulation.images || []).length === 0 ? <Alert severity="info" sx={{ my: 2 }}>
			<p style={{ marginTop: 0 }}>Sie können Bilder über ihre URL zu Simulationsseiten hinzufügen. Klicken Sie einfach mit der rechten Maustaste auf ein öffentlich zugängliches (oder freigegebenes) Bild, wählen Sie &quot;Bildadresse kopieren&quot; und verwenden Sie diese URL, um Ihr Bild in den Editor aufzunehmen. Das Hinzufügen von Bildern, die bereits online sind, ist daher einfach.</p>
			<p style={{ marginTop: 0 }}>Ist Ihr Bild noch nicht online? Dann laden Sie es hier in Ihre eigene Bilddatenbank hoch, um eine URL zu erhalten.</p>
		</Alert> : null}
		<CurrentImages {...{ simulation }} />
		<ImageUploader {...{ simulation }} />
	</>
}

function CurrentImages({ simulation }) {
	const { images } = simulation
	const imagesSorted = useMemo(() => (images || []).sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0), [images]) // Sort alphabetically by filename.
	const totalSize = imagesSorted.reduce((total, image) => total + image.size, 0)

	if (imagesSorted.length === 0)
		return null
	return <>
		<div style={{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: '6px' }}>
			{imagesSorted.map(image => <Image key={image.name} {...{ simulation, image }} />)}
		</div>
		{imagesSorted.length > 1 ? <p>
			Gesamtgröße aller Dateien ist <span>{fileSizeText(totalSize)}</span>. <span style={{ opacity: 0.65 }}>({Math.round(totalSize / maxLibrarySize * 100)}% von {fileSizeText(maxLibrarySize)} maximum.)</span>
			{totalSize / maxLibrarySize >= 0.6 ? <> <span>Brauchen Sie mehr Platz? Sie können direkte Links zu öffentlich in <Link to="https://hochschulcloud.nrw/">Sciebo</Link> gespeicherten Bildern erhalten. Oder Sie können einen Bild-Upload-Service wie <Link to="https://imgur.com/">Imgur</Link>, <Link to="https://imgbb.com/">ImgBB</Link> oder <Link to="https://postimages.org/">Postimages</Link> nutzen.</span></> : null}
		</p> : null}
	</>
}

const width = 140, heightImage = 120, heightLabel = 28
function Image({ simulation, image }) {
	const theme = useTheme()
	const url = useStorageUrl(`simulations/${simulation.id}/images/${image.name}`)
	const [open, setOpen] = useState(false)

	// Set up a handler for copying the URL.
	const copyUrl = useCallback(() => {
		navigator.clipboard.writeText(url)
		setOpen(true)
	}, [url])

	// Set up a handler for deleting the image.
	const deleteImage = useCallback(() => {
		if (!window.confirm('Sind Sie sicher, dass Sie dieses Bild löschen möchten?'))
			return
		updateSimulation(simulation.id, { images: arrayRemove(image) })
		deleteFile(`simulations/${simulation.id}/images/${image.name}`)
	}, [simulation, image])

	// Render the image.
	return <div style={{ background: theme.palette.primary.main, display: 'flex', flexFlow: 'column nowrap', borderRadius: '8px', alignItems: 'center', position: 'relative' }}>
		<div style={{ position: 'absolute', top: 4, right: 4 }} onClick={copyUrl}>
			<Tooltip title="URL kopieren" arrow>
				<Fab color="secondary" size="small" >
					<ContentCopy />
				</Fab>
			</Tooltip>
			<Snackbar
				open={open}
				autoHideDuration={1200}
				onClose={() => setOpen(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				message="Die URL wurde in die Zwischenablage kopiert"
			/>
		</div>
		<div style={{ width: `${width}px`, height: `${heightImage}px`, boxSizing: 'content-box', padding: '12px', display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center' }}>
			{url ? <img src={url} style={{ maxWidth: `${width}px`, maxHeight: `${heightImage}px` }} /> : null}
		</div>
		<div style={{ color: theme.palette.primary.contrastText, fontSize: '10px', width: `${width}px`, height: `${heightLabel}px`, boxSizing: 'content-box', padding: '0px 2px 6px', display: 'flex', flexFlow: 'column nowrap', alignItems: 'center', justifyContent: 'center', lineHeight: '5px' }}>
			<div style={{ textAlign: 'center' }}>
				<span style={{}}>{image.name}</span> <span style={{ opacity: 0.65 }}>({fileSizeText(image.size)})</span> <span><Delete sx={{ width: '16px', height: '16px', transform: 'translateY(4px)', cursor: 'pointer' }} onClick={deleteImage} /></span>
			</div>
		</div>
	</div>
}

function ImageUploader({ simulation }) {
	const theme = useTheme()
	const [file, setFile] = useState()
	const [percentage, setPercentage] = useState()
	const totalSizeUsed = (simulation.images || []).reduce((totalSize, image) => totalSize + image.size, 0)

	// On a change in images, like a removal of one, get rid of the file stored.
	useEffect(() => {
		setFile(undefined)
	}, [totalSizeUsed])

	const setAndSaveFile = async (event) => {
		// Set the file locally.
		const file = event.target.files[0]
		setFile(file)
		if (file.size > maxFileSize)
			return
		if (file.size + totalSizeUsed > maxLibrarySize)
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
				deleteFile(filePath)
			},
			async () => { // On finished uploading.
				const imageData = { name: file.name, size: file.size }
				if (existingFileIndex !== -1) { // Existing name? Overwrite the array entry.
					const images = [...simulationImages]
					images[existingFileIndex] = imageData
					await updateSimulation(simulation.id, { images })
				} else { // No file? Add it to the array.
					await updateSimulation(simulation.id, { images: arrayUnion(imageData) })
				}
				setFile(undefined)
			})
	}

	// When a file is selected, show an upload notification, or an error if there's a problem.
	if (file) {
		if (file.size > maxFileSize) { // File too large?
			return <>
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Die Datei <span>({fileSizeText(file.size)})</span> ist größer als das zulässige Maximum <span>({fileSizeText(maxFileSize)})</span>.</p>
				<UploadButton onChange={setAndSaveFile} />
			</>
		}
		if (file.size + totalSizeUsed > maxLibrarySize) { // Maximum storage reached?
			return <>
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Diese Datei <span>({fileSizeText(file.size)})</span> passt nicht in den verbleibenden Speicherplatz. Es ist nur noch <span>({fileSizeText(maxLibrarySize - totalSizeUsed)})</span> übrig.</p>
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
