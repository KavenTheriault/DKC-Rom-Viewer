import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Explorer } from './pages/explorer';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Explorer />,
  },
  {
    path: 'error',
    element: <div>An error occurred, look in console to know more.</div>,
  },
]);

export const Router = () => <RouterProvider router={router} />;
