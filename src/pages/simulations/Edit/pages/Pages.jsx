import { StartingPage } from './StartingPage'
import { PageList } from './PageList'
import { OtherOptions } from './OtherOptions'

export function Pages({ simulation }) {
	return <>
		<StartingPage {...{ simulation }} />
		<PageList {...{ simulation }} />
		<OtherOptions {...{ simulation }} />
	</>
}
