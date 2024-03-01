import MuiAppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

import ArrowBack from '@mui/icons-material/ArrowBack'
import Person from '@mui/icons-material/Person'

import { useNavigate } from 'react-router-dom'

import { useUser } from '../firebase'

export function AppBar({ title, backButton }) {
	const navigate = useNavigate()
	const user = useUser()

	return <Box>
		<MuiAppBar position="static">
			<Container maxWidth="xl">
				<Toolbar sx={{ padding: '0 !important' }}>
					{backButton ? <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={() => navigate(backButton)}>
						<ArrowBack />
					</IconButton> : null}
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						{title || '[Seitentitel fehlt]'}
					</Typography>
					{!user || backButton ? null : <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ ml: 2, pr: 0 }} onClick={() => navigate('/account')}>
						<Person sx={{ width: '2.5rem', height: '2.5rem' }} />
					</IconButton>}
				</Toolbar>
			</Container>
		</MuiAppBar>
	</Box>
}
