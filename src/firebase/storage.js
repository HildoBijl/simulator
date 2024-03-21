import { getStorage } from 'firebase/storage'

import { app } from './main'

export const storage = getStorage(app)
