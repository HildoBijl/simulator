import { Page } from 'components'
import { useIsOwner } from 'simulations'

export function EmptySimulation({ simulation }) {
	const isOwner = useIsOwner(simulation)
	return <Page title={simulation.title || '[Simulationstitel fehlt]'} showLogo="right">
		{isOwner ?
			<p>Sie haben noch keine Seiten zu dieser Simulation hinzugefügt. Fügen Sie eine Seite hinzu, um zu beginnen.</p> :
			<p>Der Ersteller der Simulation hat noch keine Seiten zu dieser Simulation hinzugefügt. Ohne Seiten kann nichts angezeigt werden.</p>}
	</Page>
}
