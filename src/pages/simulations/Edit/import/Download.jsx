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
		<h4>Antwortmöglichkeiten</h4>
		<p>Die Antwortmöglichkeiten für jede Frage werden in der Spalte "Antwortmöglichkeiten" gespeichert. Jede Antwortmöglichkeit wird in einer neuen Zeile angegeben und hat das folgende Format:</p>
		<pre>Beschreibung|Rückmeldung|Folgeseite|UpdateScript</pre>
		<p>Wobei:</p>
		<ul>
			<li><strong>Beschreibung</strong>: Der Text der Antwortmöglichkeit (in Markdown-Format)</li>
			<li><strong>Rückmeldung</strong>: Die Rückmeldung, die angezeigt wird, wenn diese Option gewählt wird (in Markdown-Format)</li>
			<li><strong>Folgeseite</strong>: Die ID der nächsten Seite (optional)</li>
			<li><strong>UpdateScript</strong>: Das Skript, das die Parameter aktualisiert, wenn diese Option ausgewählt wird</li>
		</ul>
		<p>Beispiel:</p>
		<pre>
**Ja, ich stimme zu**|Danke für Ihre Zustimmung!|next_page_id|score = score + 10
**Nein, ich lehne ab**|Das ist schade.|end|score = score - 5
		</pre>
		<p>Sie können die Rückmeldung, Folgeseite und das UpdateScript weglassen, indem Sie einfach nichts nach dem | eingeben.</p>

		<h4>Parameter</h4>
		<p>Die Excel-Datei enthält auch einen separaten Tab für Parameter, in dem Sie die Parameter (Variablen) der Simulation bearbeiten können. Jeder Parameter hat folgende Felder:</p>
		<ul>
			<li><strong>ID</strong>: Die eindeutige Kennung des Parameters (nicht ändern für bestehende Parameter)</li>
			<li><strong>Name</strong>: Der Name des Parameters, wie er in Skripten verwendet wird (z.B. "score" oder "hp")</li>
			<li><strong>Beschreibung</strong>: Der Anzeigename/Titel des Parameters</li>
			<li><strong>Standardwert</strong>: Der Anfangswert des Parameters</li>
			<li><strong>Minimalwert</strong>: Der minimale Wert für den Parameter (optional)</li>
			<li><strong>Maximalwert</strong>: Der maximale Wert für den Parameter (optional)</li>
		</ul>
		<p>Beispiel für einen Parameter:</p>
		<pre>
ID            | Name  | Beschreibung     | Standardwert | Minimalwert | Maximalwert
------------- | ----- | ---------------- | ------------ | ----------- | -----------
(leer für neu)| score | Spielerpunktzahl | 0            | 0           | 100
		</pre>
		<p>Parameter können in Update-Skripten für Antwortoptionen verwendet werden und in Texten angezeigt werden.</p>
	</>
}

// downloadSimulation takes a simulation, turns it into an Excel file, and makes the browser download it.
function downloadSimulation(simulation) {
	const workbook = generateSimulationWorkbook(simulation)
	downloadWorkbook(workbook)
}