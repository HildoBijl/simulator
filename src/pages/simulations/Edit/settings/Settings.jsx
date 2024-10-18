import { MainSettings } from './MainSettings'
import { OtherSettings } from './OtherSettings'
import { Ownership } from './Ownership'
import { RemoveSimulation } from './RemoveSimulation'

export function Settings({ simulation }) {
	return <>
		<MainSettings {...{ simulation }} />
		<OtherSettings {...{ simulation }} />
		<Ownership {...{ simulation }} />
		<RemoveSimulation {...{ simulation }} />
	</>
}
