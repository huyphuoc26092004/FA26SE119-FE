import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { useAuthStore } from './stores/authStore';
import './index.css';
import './styles/ccv-buttons.css';
useAuthStore.getState().restoreSession();
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
