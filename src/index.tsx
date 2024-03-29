import React from 'react';
import ReactDOM from 'react-dom/client';
import { createGlobalStyle } from 'styled-components';
import { Router } from './router';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

const GlobalStyle = createGlobalStyle`
  html {
    overflow-y: auto;
  }

  #root {
    display: flex;
  }
`;

root.render(
  <React.StrictMode>
    <GlobalStyle />
    <Router />
  </React.StrictMode>,
);
