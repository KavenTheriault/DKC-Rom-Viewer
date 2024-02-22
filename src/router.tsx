import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/home';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
        errorElement: <div>Page not found</div>,
    },
    {
        path: 'sprite',
        element: <div>Sprite page</div>,
    },
    {
        path: 'animation',
        element: <div>Animation page</div>,
    },
    {
        path: 'entity',
        element: <div>Entity page</div>,
    },
    {
        path: 'palette',
        element: <div>Palette page</div>,
    },
    {
        path: 'error',
        element: <div>An error occurred, look in console to know more.</div>,
    },
]);

export const Router = () => <RouterProvider router={router} />;
