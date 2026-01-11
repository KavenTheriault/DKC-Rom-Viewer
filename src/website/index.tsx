import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from './router';
import { AppStateProvider } from './state/state-provider';
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html {
    /* Override Bulma’s forced vertical scrollbar */
    overflow-y: auto;
  }
`;

export const startApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
  );
  root.render(
    <React.StrictMode>
      <GlobalStyle />
      <AppStateProvider>
        <Router />
      </AppStateProvider>
    </React.StrictMode>,
  );
};
