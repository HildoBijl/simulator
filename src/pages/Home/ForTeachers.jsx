import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'

export function ForTeachers() {
  const navigate = useNavigate()
  return <div>
    <h2>Für Lehrende</h2>
    <p>Sie können Ihre eigenen Simulationen erstellen und sie mit Ihren Studierenden teilen.</p>
    <Button variant="contained" onClick={() => navigate('/create')}>Zu den Ersteller-Tools</Button>
  </div>
}
