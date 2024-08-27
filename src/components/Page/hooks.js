import { useContext } from 'react'

import { TabContext } from './Page'

export function useTab() {
	return useContext(TabContext)
}
