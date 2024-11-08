import { useState } from 'react'
import Button from '@mui/material/Button'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import { deleteField } from 'firebase/firestore'

import { FormPart, MCE } from 'components'
import { updateSimulation } from 'simulations'

export function OtherOptions({ simulation }) {
	const [showHeader, setShowHeader] = useState(!!simulation.pageHeader)
	const [showFooter, setShowFooter] = useState(!!simulation.pageFooter)

	return <>
		<h2>Weitere Seitenoptionen</h2>
		{showHeader ? <Header {...{ simulation }} /> : null}
		{showFooter ? <Footer {...{ simulation }} /> : null}
		<FormPart style={{ display: 'flex', flexFlow: 'row wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
			{!showHeader ? <Button variant="contained" onClick={() => setShowHeader(true)}>Seitenkopf einstellen</Button> : null}
			{!showFooter ? <Button variant="contained" onClick={() => setShowFooter(true)}>Seitenfuß einstellen</Button> : null}
		</FormPart>
	</>
}

function Header({ simulation }) {
	return <>
		<FormPart>
			{simulation.pageHeader ? null : <Alert severity="info" sx={{ my: 2 }}>Der Seitenkopf wird über ALLEN Seiten angezeigt. (Es sei denn, dies wird ausdrücklich angegeben; siehe die Einstellung unten.) Sie können damit zum Beispiel kurz den Wert der wichtigsten Parameter anzeigen.</Alert>}
			<MCE label="Seitenkopf" height="175" value={simulation.pageHeader} path={`simulations`} documentId={simulation.id} field="pageHeader" />
			<FormGroup sx={{ py: '0.2rem', px: '0.5rem' }}>
				<FormControlLabel control={<Switch checked={simulation.allowHeaderHiding || false} onChange={event => updateSimulation(simulation.id, { allowHeaderHiding: event.target.checked ? true : deleteField() })} />} label="Seiten erlauben, den Seitenkopf in ihren Einstellungen zu deaktivieren." />
			</FormGroup>
		</FormPart>
	</>
}

function Footer({ simulation }) {
	return <>
		<FormPart>
			{simulation.pageFooter ? null : <Alert severity="info" sx={{ my: 2 }}>Der Seitenfuß wird unter ALLEN Seiten angezeigt, unter den möglichen Antwortoptionen und der Schaltfläche &quot;Weiter&quot;. (Es sei denn, dies wird für die Seite ausdrücklich angegeben; siehe die Einstellung unten.) Sie können es zum Beispiel als Übersicht über alle mit der Simulation verbundenen Parameter verwenden.</Alert>}
			<MCE label="Seitenfuß" height="175" value={simulation.pageFooter} path={`simulations`} documentId={simulation.id} field="pageFooter" />
			<FormGroup sx={{ py: '0.2rem', px: '0.5rem' }}>
				<FormControlLabel control={<Switch checked={simulation.allowFooterHiding || false} onChange={event => updateSimulation(simulation.id, { allowFooterHiding: event.target.checked ? true : deleteField() })} />} label="Seiten erlauben, den Seitenfuß in ihren Einstellungen zu deaktivieren." />
			</FormGroup>
		</FormPart>
	</>
}
