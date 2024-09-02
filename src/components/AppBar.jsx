import MuiAppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

import ArrowBack from '@mui/icons-material/ArrowBack'
import Person from '@mui/icons-material/Person'

import { useNavigate } from 'react-router-dom'

import { useUser } from 'fb'
import logo from 'assets/logoWhite.svg'

export function AppBar({ title, backButton, showLogo, icons }) {
	const navigate = useNavigate()
	const user = useUser()

	return <Box>
		<MuiAppBar position="static" enableColorOnDark>
			<Container maxWidth="xl">
				<Toolbar sx={{ padding: '0 !important' }}>
					{backButton ? <IconButton size="large" edge="start" color="inherit" aria-label="back" sx={{ mr: 1 }} onClick={() => navigate(backButton)}>
						<ArrowBack />
					</IconButton> : null}

					{!backButton && showLogo === 'left' ? <IconButton size="large" edge="start" color="inherit" sx={{ mr: 1 }} onClick={() => navigate('/')}>
						<img src={logo} style={{ width: '2.5rem', height: '2.5rem' }} />
					</IconButton> : null}

					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						{title || '[Seitentitel fehlt]'}
					</Typography>

					{icons && icons.map(({ Icon, onClick }, index) => <IconButton key={index} size="large" edge="start" color="inherit" onClick={onClick}>
						<Icon sx={{ width: '2rem', height: '2rem' }} />
					</IconButton>
					)}

					{!backButton && showLogo === 'right' ? <IconButton size="large" edge="end" color="inherit" onClick={() => navigate('/')}>
						<img src={logo} style={{ width: '2.5rem', height: '2.5rem' }} />
					</IconButton> : null}

					{!backButton && showLogo !== 'right' && user ? <IconButton size="large" edge="end" color="inherit" onClick={() => navigate('/account')}>
						<Person sx={{ width: '2.5rem', height: '2.5rem' }} />
					</IconButton> : null}
				</Toolbar>
			</Container>
		</MuiAppBar>
	</Box>
}
