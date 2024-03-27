import { useContext } from 'react'

import { TabContext } from './components'

export function useTab() {
	return useContext(TabContext)
}
