import { createBrowserRouter } from 'react-router-dom'

import { Home, Test, ErrorPage, Create, Edit, Scripts, Documentation, Account, Simulation } from './pages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <ErrorPage />,
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
    path: '/create/documentation',
    element: <Documentation />
  },
  {
    path: '/create/:simulationId/scripts',
    element: <Scripts />
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
