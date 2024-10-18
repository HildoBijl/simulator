import { MainSettings } from './MainSettings'
import { OtherSettings } from './OtherSettings'
import { ImageLibrary } from './ImageLibrary'
import { Ownership } from './Ownership'
import { RemoveSimulation } from './RemoveSimulation'

export function Settings({ simulation }) {
	return <>
		<MainSettings {...{ simulation }} />
		<OtherSettings {...{ simulation }} />
		<ImageLibrary {...{simulation}} />
		<Ownership {...{ simulation }} />
		<RemoveSimulation {...{ simulation }} />
	</>
}
