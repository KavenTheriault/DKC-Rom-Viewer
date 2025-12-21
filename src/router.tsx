import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/home';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: 'error',
    element: <div>An error occurred, look in console to know more.</div>,
  },
]);

export const Router = () => <RouterProvider router={router} />;
