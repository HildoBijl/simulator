import { useNavigate, Link } from 'react-router-dom'
import Button from '@mui/material/Button'

export function ForTeachers() {
  const navigate = useNavigate()
  return <div>
    <h2>Für Lehrende</h2>
    <p>Sie können Ihre eigenen Simulationen erstellen und sie mit Ihren Studierenden teilen.</p>
    <Button variant="contained" onClick={() => navigate('/create')}>Zu den Ersteller-Tools</Button>

    <h2>Was ist eine Simulation?</h2>
    <p>Die Simulationen, die Sie mit dieser Web-App erstellen können, sind einfache Rollenspiele. Den Benutzern wird eine Reihe von Seiten angezeigt. Auf jeder Seite haben sie eine Entscheidung zu treffen, die als Multiple-Choice-Frage formuliert ist. Abhängig von ihrer Antwort (und möglicherweise von einer Reihe von Bedingungen, die Sie als Ersteller festlegen können) werden sie dann auf eine nächste Seite geschickt. Auf diese Weise wird eine Geschichte geschrieben.</p>
    <p>Der Simulator ist ein Produkt, das vom <Link to="https://www.hochschule-bochum.de/en/digiteach/home/" target="_blank">DigiTeach Institut</Link> der <Link to="https://www.hochschule-bochum.de/" target="_blank">Hochschule Bochum</Link> entwickelt wurde. Er wird eingesetzt, um den Studierenden kleine Erfahrungstrainings zu geben, die sie durch einfache traditionelle Prüfungsfragen nicht bekommen könnten.</p>
    <p>Möchten Sie es ausprobieren? <Link to="/create">Melden Sie sich an und beginnen Sie mit der Erstellung</Link>. Das Tool ist so aufgebaut, dass keine Einführung erforderlich ist. Es wird während der Benutzung erklärt. Bleiben Sie trotzdem irgendwo hängen? Dann hilft Ihnen vielleicht die <Link to="/create/documentation">allgemeine Dokumentation</Link> weiter.</p>
  </div>
}
