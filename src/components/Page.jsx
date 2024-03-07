import Container from '@mui/material/Container'

import { AppBar } from './AppBar'

export function Page({ children, addAppBar = true, title, backButton, showLogo }) {
	return <>
		{addAppBar ? <AppBar title={title} backButton={backButton} showLogo={showLogo} /> : null}
		<Container maxWidth="xl" sx={{ flexGrow: 1 }}>
			{children}
		</Container>
	</>
}
