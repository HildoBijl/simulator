import { Link } from 'react-router-dom'

import { Page, Code } from 'components'

export function Documentation() {
	return <Page title="Allgemeine Dokumentation" backButton={`/create`}>
		<p>Die Werkzeuge zur Erstellung des Simulators wurden so eingerichtet, dass für ihre Verwendung keine Dokumentation erforderlich sein sollte. Neue Funktionen werden immer mit einer kleinen Erklärung angezeigt, wenn sie auftauchen. Wenn Sie dennoch etwas über die Erstellung von Simulationen nachlesen möchten, ist diese Seite genau das Richtige für Sie.</p>
		<h2>Seiten, Fragen und Verbindungen</h2>
		<p>Der Grundgedanke des Simulators ist, dass es sich um eine Reihe von miteinander verbundenen Seiten handelt. Jede Seite hat eine Folgeseite, die darauf folgt. So können Sie eine Geschichte erzählen.</p>
		<p>Sie können eine Seite in eine Frage verwandeln, indem Sie Antwortmöglichkeiten hinzufügen. Dann können Sie die Folgeseite für jede Antwortmöglichkeit festlegen und so eine Verzweigungsstruktur für Ihre Simulation schaffen. Was angezeigt wird, hängt von den Entscheidungen des Benutzers ab.</p>
		<h2>Variablen und Update-Skripte</h2>
		<p>Sie können die Komplexität einer Simulation erhöhen, indem Sie Parameter hinzufügen. Dies kann eine beliebige numerische Größe sein, wie &quot;Geld&quot;, &quot;Lebenspunkte&quot; oder was auch immer man sich vorstellen kann.</p>
		<p>Zunächst müssen die Parameter erstellt werden, wobei sie einen Namen erhalten, der für die Programmierung verwendet wird. Dies ist zum Beispiel &quot;<Code>hp</Code>&quot;. Sobald die Variablen erstellt sind, können ihre Werte durch verschiedene Skripte aktualisiert werden. Ein Beispiel für ein Skript ist &quot;<Code>hp = 10</Code>&quot; oder &quot;<Code>hp = hp - 4</Code>&quot;.</p>
		<p>Skripte sind oft mit Seiten verbunden. Eine Seite kann zwei Arten von Skripten enthalten:</p>
		<ul>
			<li>Ein Eintrittsskript, das beim Laden der Seite ausgeführt wird.</li>
			<li>Ein Update-Skript, das immer dann ausgeführt wird, wenn der Benutzer eine Antwortmöglichkeit auf dieser Seite auswählt. (Oder beim Verlassen der Seite, wenn es keine Antwortmöglichkeiten gibt.)</li>
		</ul>
		<p>Außerdem kann jede Antwortmöglichkeit ihr eigenes Aktualisierungsskript haben, das das Aktualisierungsskript der Seite außer Kraft setzt. Zum Beispiel könnte eine Antwortmöglichkeit (einen Gesundheitstrank trinken) die <Code>hp</Code> erhöhen, während eine andere Antwortmöglichkeit (einen Kampf wählen) die <Code>hp</Code> verringern könnte.</p>
		<h2>Allgemeine Tipps und Tricks zum Code</h2>
		<p>Die meisten Update-Skripte sind relativ einfach, und es ist keine große Programmiererfahrung erforderlich. Wenn Sie jedoch kreativ werden wollen, können Sie auch fortgeschrittenere Update-Skripte programmieren. Die verwendete Programmiersprache ist Javascript, so dass Sie zum Beispiel auch <Link to="https://www.w3schools.com/js/js_if_else.asp" target="_blank">Javascript if-Anweisungen</Link> oder Ähnliches implementieren können.</p>
		<p>Darüber hinaus bietet der Simulator eine Reihe eigener Funktionen, die bei Aktualisierungen verwendet werden können. Wir haben die folgenden hinzugefügt.</p>
		<ul>
			<li><Code>rand(min, max)</Code> gibt eine zufällige Kommazahl zwischen den angegebenen Werten zurück. Sie können zum Beispiel <Code>hp = hp - rand(0.2, 1.6)</Code> verwenden.</li>
			<li><Code>randInt(min, max)</Code> gibt eine zufällige ganze Zahl zwischen (einschließlich) den angegebenen Werten zurück. Sie können zum Beispiel <Code>hp = hp - randInt(2, 4)</Code> verwenden, um entweder 2, 3 oder 4 Lebenspunkte abzuziehen.</li>
			<li><Code>roundTo(num, decimals)</Code> rundet eine Zahl auf die angegebene Anzahl von Nachkommastellen. <Code>roundTo(12.345, 2)</Code> ist also <Code>12.35</Code> und <Code>roundTo(123.45, -1)</Code> ist <Code>120</Code>.</li>
			<li><Code>roundToDigits(num, digits)</Code> rundet eine Zahl auf die angegebene Anzahl von Ziffern. <Code>roundToDigits(12.345, 4)</Code> ist also <Code>12.35</Code> und <Code>roundToDigits(123.45, 2)</Code> ist <Code>120</Code>.</li>
		</ul>
		<p>Benötigen Sie weitere unterstützende Funktionen? Es ist auch möglich, Ihre eigenen unterstützenden Funktionen hinzuzufügen! Sehen Sie sich die <Link to="https://www.w3schools.com/js/js_functions.asp" target="_blank">Dokumentation der Javascript-Funktionen</Link> an, gehen Sie auf die Parameter-Seite, und fügen Sie Ihre eigenen unterstützenden Funktionen hinzu. Diese Funktionen werden in jedem Skript Ihrer gesamten Simulation verfügbar sein.</p>
		<h2>Variablen auf Seiten anzeigen</h2>
		<p>Wenn Sie Variablen haben, möchten Sie diese vielleicht auf Ihren Seiten anzeigen. Zu diesem Zweck können Sie geschweifte Klammern verwenden. Sie können zum Beispiel sagen: &quot;Sie haben noch <Code>&#123;hp&#125;</Code> Lebenspunkte übrig.&quot; Auf Ihrer Seite wird dann die Zahl angezeigt. Dies ist besonders nützlich, wenn Sie dies in den Seitenkopf/Seitenfuß einfügen, der auf jeder Seite angezeigt wird.</p>
		<p>Was hinter den Kulissen passiert, ist, dass der Teil zwischen geschweiften Klammern als Javascript-Code ausgewertet wird. Sie können also auch Berechnungen durchführen. Du kannst zum Beispiel sagen: &quot;Nachdem du einen Trank getrunken hast, hast du <Code>&#123;hp+5&#125;</Code> Lebenspunkte.&quot; Bei komplizierteren Berechnungen ist es ratsam, eigene unterstützende Funktionen zu verwenden. (Siehe oben.)</p>
		<p>Sie können auch Text in Abhängigkeit von Variablenwerten anzeigen. In diesem Fall verwenden Sie den <Link to="https://www.w3schools.com/react/react_es6_ternary.asp" target="_blank">ternären Javascript-Operator</Link>, zum Beispiel durch &quot;Ihre Lebenspunkte sind <Code>&#123;hp &lt; 10 ? &apos;niedrig&apos; : &apos;OK&apos;&#125;</Code>.&quot; Was nach dem Fragezeichen kommt, wird angezeigt, wenn die Bedingung erfüllt ist, und was nach dem Doppelpunkt kommt, wird angezeigt, wenn die Bedingung nicht erfüllt ist.</p>
		<p>Für Fortgeschrittene: Variablen können (neben Zahlen) auch Listenwerte wie <Code>x = [2, 5, 8, 11]</Code> oder Objektwerte wie <Code>c = &#123;x:2, y:5&#125;</Code> haben. Jeder gültige <Link to="https://www.w3schools.com/js/js_datatypes.asp" target="_blank">Javascript-Variablentyp</Link> (gespeichert als JSON) ist erlaubt. Für den Fall, dass Sie eine große Anzahl von Variablen benötigen, ohne sie alle manuell zu definieren, lohnt sich diese Lösung.</p>
		<h2>Ereignisse und Bedingungen</h2>
		<p>Ereignisse sind Situationen, in denen Sie den normalen Ablauf der Simulation gewaltsam unterbrechen. Ereignisse haben immer eine Bedingung, die sie auslöst, wie &quot;<Code>hp &lt; 0</Code>&quot;. (Dies wird beim Verlassen einer Seite überprüft, nachdem das Update-Skript ausgeführt wurde; nicht beim Betreten einer Seite.) Die Ereignisse haben auch eine Seite, zu der gesprungen wird, wenn sie eintreten. Dies könnte zum Beispiel eine Seite sein, die anzeigt &quot;Du bist gestorben&quot; oder was auch immer man sich vorstellen kann.</p>
		<p>Nachdem die angegebene Seite angezeigt wird, gibt es zwei Möglichkeiten. Entweder wir fahren von dieser Seite aus fort und verwenden die für diese Seite definierte Folgeseite. (Dies ist nützlich im Falle eines bedeutenden Ereignisses wie &quot;Sie sind gestorben&quot;.) Oder, falls gewünscht, können wir wieder in den ursprünglichen Ablauf züruckspringen und dort weitermachen, wo wir aufgehört haben. (Dies ist nützlich, wenn es sich nur um eine Informationsseite handelt, wie z. B. &quot;Ihr Reisegefährte sagt Ihnen, dass Sie aufpassen sollen, weil Ihre Lebenspunkte zur Neige gehen.&quot;)</p>
	</Page>
}
