import { createBrowserRouter } from 'react-router-dom'

import { Home, Test, Error } from './pages'

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <Error />,
  },
  {
    path: "/test",
    element: <Test />,
  },
])
