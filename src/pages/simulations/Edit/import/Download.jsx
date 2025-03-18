import Button from '@mui/material/Button'

import { generateSimulationWorkbook, downloadWorkbook } from './util'

export function Download({ simulation }) {
	return <>
		<h2>Herunterladen</h2>
		<p>Sie können Ihre aktuelle Simulation als Excel-Datei herunterladen, um sie dann zu ändern und (unten) wieder hochzuladen.</p>
		<Button variant="contained" onClick={() => downloadSimulation(simulation)}>Simulation als Excel-Datei herunterladen</Button>
		<h4>Hinweise zum Ändern der Datei</h4>
		<p>Beim Ändern der Excel-Simulationsdatei gibt es einige Dinge zu beachten.</p>
		<ul>
			<li>Viele Elemente (wie Seiten und Parameter) haben eine ID. Diese ID wird hinter den Kulissen verwendet, um das richtige Element zu überschreiben. Ändern Sie diese ID nicht. Wenn Sie dies doch tun, wird das Element nicht ordnungsgemäß überschrieben, sondern es wird ein neues Element erstellt.</li>
			<li>Wenn Sie ein neues Element wie eine neue Seite hinzufügen möchten, lassen Sie die ID leer. Wir werden beim Importieren eine ID generieren. (Sie können sich auch eine eigene ID ausdenken, aber das ist nicht empfehlenswert.)</li>
			<li>Die ID wird auch für Links verwendet, z. B. welche Seite sich in welchem Ordner befindet. Wenn Sie Ihre eigenen Links einrichten wollen, können Sie auch hier die ID verwenden, oder Sie können die Zeilennummer der Excel-Datei verwenden. Beim Importieren werden die Zeilennummern dann durch die richtige ID ersetzt.</li>
		</ul>
		<h4>Formatierung von Texten</h4>
		<p>Die Texte in den Beschreibungen werden in Markdown-Format gespeichert. Hier sind die wichtigsten Formatierungsmöglichkeiten:</p>
		<ul>
			<li><strong>Fett</strong>: Verwenden Sie <code>**Text**</code> oder <code>__Text__</code></li>
			<li><em>Kursiv</em>: Verwenden Sie <code>*Text*</code> oder <code>_Text_</code></li>
			<li>Listen: Verwenden Sie <code>- </code> oder <code>* </code> am Anfang jeder Zeile</li>
			<li>Nummerierte Listen: Verwenden Sie <code>1. </code>, <code>2. </code> usw.</li>
			<li>Links: Verwenden Sie <code>[Linktext](URL)</code></li>
			<li>Zeilenumbrüche: Fügen Sie zwei Leerzeichen am Ende der Zeile ein</li>
			<li>Absätze: Lassen Sie eine Leerzeile zwischen den Absätzen</li>
		</ul>
		<p>Beispiel:</p>
		<pre>
**Wichtige Frage**

Bitte wählen Sie eine der folgenden Optionen:

1. Erste Option
2. Zweite Option
3. Dritte Option

*Hinweis*: Dies ist ein _wichtiger_ Hinweis.
		</pre>
	</>
}

// downloadSimulation takes a simulation, turns it into an Excel file, and makes the browser download it.
function downloadSimulation(simulation) {
	const workbook = generateSimulationWorkbook(simulation)
	downloadWorkbook(workbook)
}
