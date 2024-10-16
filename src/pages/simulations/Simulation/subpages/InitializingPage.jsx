import { Page } from 'components'

export function InitializingPage({ simulation }) {
	return <Page title={simulation.title || '[Simulationstitel fehlt]'} showLogo="right">
		<p>Simulation starten...</p>
	</Page>
}
