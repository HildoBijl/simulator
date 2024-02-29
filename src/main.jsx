import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Home, Test, Error } from './pages'
import './index.css'

const router = createBrowserRouter([
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
