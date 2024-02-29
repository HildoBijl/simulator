import { useRouteError, Link } from 'react-router-dom'

export function Error() {
  const error = useRouteError()
  console.error(error)

  return (
    <div id="error-page">
      <h1>Ups!</h1>
      <p>Da ist etwas schief gelaufen.</p>
			<p><Link to="">Zurück zur Startseite.</Link></p>
    </div>
  )
}
