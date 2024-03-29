import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/home';
import { Viewer } from './pages/viewer';
import { CanvasTest } from './pages/canvas-test';

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
    path: 'canvas-test',
    element: <CanvasTest />,
  },
  {
    path: 'error',
    element: <div>An error occurred, look in console to know more.</div>,
  },
]);

export const Router = () => <RouterProvider router={router} />;
