import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from './router';
import { AppStateProvider } from './state/state-provider';

export const startApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
  );
  root.render(
    <React.StrictMode>
      <AppStateProvider>
        <Router />
      </AppStateProvider>
    </React.StrictMode>,
  );
};
