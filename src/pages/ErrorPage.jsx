import { useRouteError, Link } from 'react-router-dom'
import Container from '@mui/material/Container'

export function ErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
      <h1>Ups!</h1>
      <p>Da ist etwas schief gelaufen.</p>
      <p><Link to="/">Zurück zur Startseite</Link></p>
    </Container>
  )
}
