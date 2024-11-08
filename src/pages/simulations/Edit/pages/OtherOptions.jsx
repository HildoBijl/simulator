import { useState } from 'react'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import { FormPart, MCE } from 'components'

export function OtherOptions({ simulation }) {
	const [showHeader, setShowHeader] = useState(!!simulation.pageHeader)
	const [showFooter, setShowFooter] = useState(!!simulation.pageFooter)

	return <>
		<h2>Weitere Seitenoptionen</h2>
		{showHeader ? <Header {...{ simulation }} /> : null}
		{showFooter ? <Footer {...{ simulation }} /> : null}
		<FormPart style={{ display: 'flex', flexFlow: 'row wrap', gap: '0.5rem' }}>
			{!showHeader ? <Button variant="contained" onClick={() => setShowHeader(true)}>Seitenkopf einstellen</Button> : null}
			{!showFooter ? <Button variant="contained" onClick={() => setShowFooter(true)}>Seitenfuß einstellen</Button> : null}
		</FormPart>
	</>
}

function Header({ simulation }) {
	return <>
		<FormPart>
			<MCE label="Seitenkopf" height="175" value={simulation.pageHeader} path={`simulations`} documentId={simulation.id} field="pageHeader" />
			{simulation.pageHeader ? null : <Alert severity="info" sx={{ my: 2 }}>Der Seitenkopf wird über ALLEN Seiten angezeigt. (Es sei denn, dies wird ausdrücklich angegeben; siehe die Einstellung unten.) Sie können damit zum Beispiel kurz den Wert der wichtigsten Parameter anzeigen.</Alert>}
		</FormPart>
	</>
}

function Footer({ simulation }) {
	return <>
		<FormPart>
			<MCE label="Seitenfuß" height="175" value={simulation.pageFooter} path={`simulations`} documentId={simulation.id} field="pageFooter" />
			{simulation.pageFooter ? null : <Alert severity="info" sx={{ my: 2 }}>Der Seitenfuß wird unter ALLEN Seiten angezeigt, unter den möglichen Antwortoptionen und der Schaltfläche &quot;Weiter&quot;. (Es sei denn, dies wird für die Seite ausdrücklich angegeben; siehe die Einstellung unten.) Sie können es zum Beispiel als Übersicht über alle mit der Simulation verbundenen Parameter verwenden.</Alert>}
		</FormPart>
	</>
}
