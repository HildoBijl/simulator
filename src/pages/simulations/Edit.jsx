import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import { deleteField } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

import { getBaseUrl } from '../../util'
import { useUserId, storage, useStorageUrl } from '../../firebase'
import { useSimulation, unlinkUserFromSimulation, getSimulationByUrl, updateSimulation, deleteMediaFile } from '../../simulations'
import { Page } from '../../components'

const EditPage = ({ children }) => <Page title="Simulation bearbeiten" backButton="/create">{children}</Page>

export function Edit() {
	const navigate = useNavigate()
	const { simulationId } = useParams()
	const simulation = useSimulation(simulationId)

	// When the simulation is missing, go back to the create page.
	useEffect(() => {
		if (simulation === null)
			navigate('/create')
	}, [simulation, navigate])

	// On missing data, we're probably still loading the simulation.
	if (!simulation)
		return <EditPage><p>Simulation laden...</p></EditPage>

	// Show the simulation form itself.
	return <EditForSimulation simulation={simulation} />
}

function EditForSimulation({ simulation }) {
	return <EditPage>
		<ChangeTitle simulation={simulation} />
		<ChangeUrl simulation={simulation} />
		<ChangeDescription simulation={simulation} />
		<ChangeMedia simulation={simulation} />
		<RemoveSimulation simulation={simulation} />
	</EditPage>
}

function ChangeTitle({ simulation }) {
	// Set up a handler that saves the title.
	const [title, setTitle] = useState(simulation?.title || '')
	const setAndSaveTitle = async (title) => {
		setTitle(title)
		await updateSimulation(simulation.id, { title })
	}

	// Render the form part.
	return <>
		<h2>Titel</h2>
		<p>Der Titel ist das, was die Studierenden beim ersten Öffnen der Simulation sehen.</p>
		<TextField variant="outlined" fullWidth label="Titel" value={title} onChange={(event) => setAndSaveTitle(event.target.value)} />
	</>
}

function ChangeUrl({ simulation }) {
	// Set up a handler that, upon a change, filters out unwanted symbols, checks for duplicates, and if all is in order saves the URL.
	const [url, setUrl] = useState(simulation?.url || '')
	const [conflict, setConflict] = useState()
	const minUrlCharacters = 2
	const setAndSaveUrl = async (url) => {
		url = url.toLowerCase().replace(/[^a-z0-9_-]/, '')
		setUrl(url)
		if (url.length >= minUrlCharacters) {
			const existingSimulation = await getSimulationByUrl(url)
			if (existingSimulation && existingSimulation.id !== simulation.id) {
				setConflict(existingSimulation)
			} else {
				setConflict(undefined)
				await updateSimulation(simulation.id, { url })
			}
		}
	}

	// Render the URL form part.
	const theme = useTheme()
	const fullUrl = `${getBaseUrl()}/s/${url}`
	return <>
		<h2>URL</h2>
		<p>Die URL ist der Link, über den der Zugriff auf die Simulation erfolgt. Sie muss in Kleinbuchstaben ohne Leerzeichen angegeben werden.</p>
		<TextField variant="outlined" fullWidth label="URL" value={url} onChange={(event) => setAndSaveUrl(event.target.value)} />
		{url.length < minUrlCharacters ?
			<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Die URL muss mindestens zwei Zeichen lang sein.</p> :
			conflict ?
				<p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Eine Simulation mit der URL &quot;{url}&quot; existiert bereits. Versuchen Sie eine andere URL.</p> :
				<p>Die Simulation kann über <Link to={fullUrl} target="_blank" rel="noopener noreferrer">{fullUrl}</Link> aufgerufen werden.</p>}
	</>
}

function ChangeDescription({ simulation }) {
	const [description, setDescription] = useState(simulation?.description || '')
	const setAndSaveDescription = async (description) => {
		setDescription(description)
		await updateSimulation(simulation.id, { description })
	}

	return <>
		<h2>Beschreibung</h2>
		<p>Die Beschreibung ist die Geschichte, die oben auf der Titelseite erscheint.</p>
		<TextField variant="outlined" fullWidth multiline label="Beschreibung" value={description} onChange={(event) => setAndSaveDescription(event.target.value)} />
	</>
}

function ChangeMedia({ simulation }) {
	const [mediaType, setMediaType] = useState(simulation?.media?.type || 'none')

	// Render the form part.
	const MediaComponent = getMediaComponent(mediaType)
	return <>
		<h2>Abbildung</h2>
		<p>Wenn Sie der Titelseite ein Bild hinzufügen möchten, wählen Sie aus, wie Sie es bereitstellen möchten.</p>
		<FormControl fullWidth>
			<InputLabel>Abbildung</InputLabel>
			<Select value={mediaType} label="Abbildung" onChange={(event) => setMediaType(event.target.value)}>
				<MenuItem value="none">Keine</MenuItem>
				<MenuItem value="internalImage">Bild hochladen</MenuItem>
				<MenuItem value="externalImage">Link zu externem Bild</MenuItem>
				<MenuItem value="externalVideo">Link zu YouTube-Video</MenuItem>
			</Select>
		</FormControl>
		<MediaComponent simulation={simulation} />
	</>
}

function getMediaComponent(mediaType) {
	switch (mediaType) {
		case 'none':
			return NoMedia
		case 'internalImage':
			return UploadImage
		case 'externalImage':
			return ProvideImageLink
		case 'externalVideo':
			return ProvideVideoLink
		default:
			throw new Error(`Invalid media type: encountered a value of "${mediaType}" but this is not among the available options.`)
	}
}

function NoMedia({ simulation }) {
	const { id, media } = simulation

	// Ensure that the media field is removed in the database.
	useEffect(() => {
		if (media) {
			deleteMediaFile(media)
			updateSimulation(id, { media: deleteField() })
		}
	}, [id, media])

	// Do not render any further message.
	return null
}

const maxFileSize = 2 // MB
function UploadImage({ simulation }) {
	const theme = useTheme()
	const [file, setFile] = useState()
	const [percentage, setPercentage] = useState()
	const imageUrl = useStorageUrl(simulation?.media?.type === 'internalImage' && simulation.media.path, simulation?.media)

	const setAndSaveFile = async (event) => {
		// Set the file locally.
		const file = event.target.files[0]
		setFile(file)
		if (file.size > maxFileSize * 1024 ** 2)
			return

		// Remove a potential old file and start uploading the new file.
		await deleteMediaFile(simulation.media)
		const extension = file.name.split('.').pop()
		const path = `simulations/${simulation.id}/startImage.${extension}`
		const storageRef = ref(storage, path)
		const uploadTask = uploadBytesResumable(storageRef, file)

		// Keep track of upload updates.
		uploadTask.on('state_changed',
			snapshot => { // On change in upload percentage.
				setPercentage(Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 100)
			},
			error => { // On error.
				console.error(error)
				updateSimulation(simulation.id, { media: deleteField() })
			},
			async () => { // On finished uploading.
				await updateSimulation(simulation.id, { media: { type: 'internalImage', path } })
				setFile(undefined)
			})
	}

	// On a given file, either show an upload error or upload notification.
	if (file) {
		if (file.size > maxFileSize * 1024 ** 2)
			return <p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Die Datei ist zu groß. Die maximale Dateigröße beträgt {maxFileSize} MB, aber die angegebene Datei ist {Math.round(file.size / 1024 ** 2 * 10) / 10} MB groß.</p>
		return <p>Das Bild wird gerade hochgeladen. Der Upload ist zu {percentage}% abgeschlossen.</p>
	}

	// On no given file, show either the file itself or an upload button.
	if (simulation?.media?.type === 'internalImage') {
		return <>
			<p>Sie haben bereits ein Bild hochgeladen.</p>
			{imageUrl ? <img src={imageUrl} style={{ maxHeight: '200px', maxWidth: '100%' }} /> : null}
			<p>Sie können ein neues Bild hochladen, um dieses zu überschreiben.</p>
			<input type="file" accept="image/*" onChange={setAndSaveFile} />
		</>
	}

	return <>
		<p>Laden Sie Ihre Datei hier hoch.</p>
		<input type="file" accept="image/*" onChange={setAndSaveFile} />
	</>
}

function ProvideImageLink({ simulation }) {
	// Set up a handler that saves the path to the image in the right format.
	const [image, setImage] = useState((simulation?.media?.type === 'externalImage' ? simulation?.media?.path : '') || '')
	const setAndSaveImage = async (image) => {
		setImage(image)
		await deleteMediaFile(simulation.media)
		await updateSimulation(simulation.id, { media: image ? { type: 'externalImage', path: image } : deleteField() })
	}

	// Render the input field.
	return <>
		<p>Geben Sie die URL des gewünschten Bildes an.</p>
		<TextField variant="outlined" fullWidth label="Abbildung" value={image} onChange={(event) => setAndSaveImage(event.target.value)} />
	</>
}

function ProvideVideoLink() {
	return <p>Diese Funktion befindet sich noch in der Entwicklung.</p>
}

function RemoveSimulation({ simulation }) {
	const userId = useUserId()
	const navigate = useNavigate()
	const lastOwner = simulation.owners.length === 1

	// Set up a handler for deleting the simulation.
	const confirmRemoval = async () => {
		if (userId && window.confirm(lastOwner ? 'Sind Sie sicher, dass Sie die Simulation dauerhaft löschen wollen?' : 'Sind Sie sicher, dass Sie sich selbst als Eigentümer dieser Simulation löschen möchten?')) {
			await unlinkUserFromSimulation(userId, simulation.id)
			navigate('/create')
		}
	}

	if (lastOwner) {
		return <>
			<h2>Simulation löschen</h2>
			<p>Sie sind der einzige Eigentümer dieser Simulation. Wenn Sie sie entfernen, wird sie dauerhaft gelöscht. Alle Spuren werden aus dem Datenspeicher entfernt und niemand wird mehr in der Lage sein, sie zu spielen.</p>
			<Button variant="contained" onClick={confirmRemoval} sx={{ mb: '1rem' }}>Simulation löschen</Button>
		</>
	}

	return <>
		<h2>Sich entfernen als Eigentümer</h2>
		<p>Es gibt mehrere Eigentümer dieser Simulation. Sie können sich selbst als Eigentümer entfernen. Die Simulation bleibt bestehen und kann von dem/den verbleibenden Eigentümer(n) verwaltet werden.</p>
		<Button variant="contained" onClick={confirmRemoval} sx={{ mb: '1rem' }}>Sich entfernen als Eigentümer</Button>
	</>
}