import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/home';
import { Viewer } from './pages/viewer';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: 'viewer',
    element: <Viewer />,
  },
  {
    path: 'error',
    element: <div>An error occurred, look in console to know more.</div>,
  },
]);

export const Router = () => <RouterProvider router={router} />;
