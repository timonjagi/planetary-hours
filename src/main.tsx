import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './app/App.tsx';
import RootLayout from './app/layout.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootLayout>
      <App />
    </RootLayout>
  </StrictMode>
);
