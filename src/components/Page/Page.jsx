import { useState, createContext } from 'react'
import { Helmet } from 'react-helmet-async'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { AppBar } from '../AppBar'

export const TabContext = createContext(0)
export function Page({ children, addAppBar = true, title, backButton, showLogo, style, tabs, icons }) {
	// Set up a state and handler for the tabs.
	const [tab, setTab] = useState(0)
	const handleChange = (event, newTab) => setTab(newTab)

	// Show the page with all requested components.
	return <>
		<Helmet><title>DigiTeach Simulator{title && !title.includes('laden') ? ` - ${title}` : ''}</title></Helmet>
		{addAppBar ? <AppBar title={title} backButton={backButton} showLogo={showLogo} icons={icons} /> : null}
		{tabs ?
			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<Container maxWidth="xl">
					<Tabs value={tab} onChange={handleChange} variant="fullWidth">
						{tabs.map((value, index) => <Tab key={index} label={value} />)}
					</Tabs>
				</Container>
			</Box> : null}
		<Container maxWidth="xl" sx={{ flexGrow: 1, pb: 3 }} style={style}>
			<TabContext.Provider value={tab}>
				{children}
			</TabContext.Provider>
		</Container>
	</>
}
