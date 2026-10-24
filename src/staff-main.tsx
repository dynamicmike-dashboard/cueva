import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import StaffApp from './StaffApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StaffApp />
  </StrictMode>,
);
