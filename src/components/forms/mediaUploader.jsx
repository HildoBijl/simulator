import { useState, useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { deleteField } from 'firebase/firestore'
import { ref, uploadBytesResumable } from 'firebase/storage'

import { useTrackedState } from '../../util'
import { storage, updateDocument, deleteMediaFile } from '../../firebase'

import { InternalImage, ExternalImage, YouTubeVideo } from '../media'

import { FormPart, FormSubPart } from './containers'

const defaultImageHeight = 200 // Pixels
const imageStyle = (imageHeight) => ({ maxHeight: `${imageHeight}px`, maxWidth: '100%' })

export function MediaUploader({ label, ...props }) {
	const [mediaType, setMediaType] = useTrackedState(props.value?.type || 'none')

	// Render the form part.
	const MediaComponent = getMediaComponent(mediaType)
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={mediaType} label={label} onChange={(event) => setMediaType(event.target.value)}>
				<MenuItem value="none">Keine</MenuItem>
				<MenuItem value="internalImage">Bild hochladen</MenuItem>
				<MenuItem value="externalImage">Link zu externem Bild</MenuItem>
				<MenuItem value="youtubeVideo">YouTube-Video</MenuItem>
			</Select>
		</FormControl>
		<MediaComponent {...props} />
	</FormPart>
}

// getMediaComponent takes a type of media, and determines which uploaded component needs to be rendered.
function getMediaComponent(mediaType) {
	switch (mediaType) {
		case 'none':
			return NoMedia
		case 'internalImage':
			return UploadImage
		case 'externalImage':
			return ProvideImageLink
		case 'youtubeVideo':
			return ProvideVideoLink
		default:
			throw new Error(`Invalid media type: encountered a value of "${mediaType}" but this is not among the available options.`)
	}
}

function NoMedia({ value, path, documentId, fieldName = 'media' }) {
	// Ensure that the media field is removed in the database.
	useEffect(() => {
		if (value) {
			deleteMediaFile(value)
			updateDocument(path, documentId, { [fieldName]: deleteField() })
		}
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	// Do not render any further message.
	return null
}

const maxFileSize = 2 // MB
function UploadImage({ value, path, documentId, fieldName = 'media', fileName = 'image', imageHeight = defaultImageHeight }) {
	const theme = useTheme()
	const [file, setFile] = useState()
	const [percentage, setPercentage] = useState()

	const setAndSaveFile = async (event) => {
		// Set the file locally.
		const file = event.target.files[0]
		setFile(file)
		if (file.size > maxFileSize * 1024 ** 2)
			return

		// Remove a potential old file and start uploading the new file.
		await deleteMediaFile(value)
		const extension = file.name.split('.').pop()
		const filePath = `${path}/${documentId}/${fileName}.${extension}`
		const storageRef = ref(storage, filePath)
		const uploadTask = uploadBytesResumable(storageRef, file)

		// Keep track of upload updates.
		uploadTask.on('state_changed',
			snapshot => { // On change in upload percentage.
				setPercentage(Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 100)
			},
			error => { // On error.
				console.error(error)
				updateDocument(path, documentId, { [fieldName]: deleteField() })
			},
			async () => { // On finished uploading.
				await updateDocument(path, documentId, { [fieldName]: { type: 'internalImage', path: filePath } })
				setFile(undefined)
			})
	}

	// When a file is selected, show an upload notification, or an error if there's a problem.
	if (file) {
		if (file.size > maxFileSize * 1024 ** 2) { // File too large?
			return <>
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Die Datei ist zu groß. Die maximale Dateigröße beträgt {maxFileSize} MB, aber die angegebene Datei ist {Math.round(file.size / 1024 ** 2 * 10) / 10} MB groß.</p>
				<ImageUpload onChange={setAndSaveFile} />
			</>
		}
		return <p>Das Bild wird gerade hochgeladen. Der Upload ist zu {percentage}% abgeschlossen.</p>
	}

	// When no file is selected, show (if present) the already existing image, together with an upload button.
	return <FormSubPart>
		{value?.type === 'internalImage' ? <FormSubPart>
			<InternalImage path={value.path} extraUpdateParameter={value.media} style={imageStyle(imageHeight)} />
		</FormSubPart> : null}
		<ImageUpload onChange={setAndSaveFile} />
	</FormSubPart>
}

function ImageUpload({ onChange }) {
	return <Button variant="contained" component="label">
		Neues Bild hochladen
		<input type="file" accept="image/*" onChange={onChange} hidden />
	</Button>
}

function ProvideImageLink({ value, path, documentId, fieldName = 'media', imageHeight = defaultImageHeight }) {
	// Set up a handler that saves the path to the image in the right format.
	const [image, setImage] = useTrackedState((value?.type === 'externalImage' ? value?.path : '') || '')
	const setAndSaveImage = async (image) => {
		setImage(image)
		await deleteMediaFile(value)
		await updateDocument(path, documentId, { [fieldName]: image ? { type: 'externalImage', path: image } : deleteField() })
	}

	// Render the input field.
	return <>
		<FormSubPart>
			<TextField variant="outlined" fullWidth label="Abbildung URL" value={image} onChange={(event) => setAndSaveImage(event.target.value)} />
		</FormSubPart>
		<FormSubPart>
			<ExternalImage path={image} style={imageStyle(imageHeight)} />
		</FormSubPart>
	</>
}

function ProvideVideoLink({ value, path, documentId, fieldName = 'media', imageHeight = defaultImageHeight }) {
	// Set up a handler that saves the path to the image in the right format.
	const [video, setVideo] = useTrackedState((value?.type === 'youtubeVideo' ? value?.id : '') || '')
	const setAndSaveVideo = async (video) => {
		setVideo(video)
		await deleteMediaFile(value)
		await updateDocument(path, documentId, { [fieldName]: video ? { type: 'youtubeVideo', id: video } : deleteField() })
	}

	// Render the input field.
	return <>
		<FormSubPart>
			<TextField variant="outlined" fullWidth label="YouTube-Video ID (z.B. &quot;aBc1DE_f2G3h&quot;)" value={video} onChange={(event) => setAndSaveVideo(event.target.value)} />
		</FormSubPart>
		<FormSubPart>
			<YouTubeVideo id={video} height={imageHeight} />
		</FormSubPart>
	</>
}
