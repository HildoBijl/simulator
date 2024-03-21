import { createBrowserRouter } from 'react-router-dom'

import { Home, Test, Error, Create, Edit, Account, Simulation } from './pages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <Error />,
  },
  {
    path: '/test',
    element: <Test />,
  },
  {
    path: '/create',
    element: <Create />,
  },
  {
    path: '/create/:simulationId',
    element: <Edit />,
  },
  {
    path: '/account',
    element: <Account />,
  },
  {
    path: '/s/:simulationUrl',
    element: <Simulation />
  },
])
