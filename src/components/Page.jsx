import Container from '@mui/material/Container'

import { AppBar } from './AppBar'

export function Page({ children, addAppBar = true, title, backButton, showLogo, style }) {
	return <>
		{addAppBar ? <AppBar title={title} backButton={backButton} showLogo={showLogo} /> : null}
		<Container maxWidth="xl" sx={{ flexGrow: 1 }} style={style}>
			{children}
		</Container>
	</>
}
