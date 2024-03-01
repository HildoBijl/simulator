import { createBrowserRouter } from 'react-router-dom'

import { Home, Test, Error, Create, Account } from './pages'

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
    path: '/account',
    element: <Account />,
  },
])
