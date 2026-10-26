import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './store';
import App from './App';
import './styles.css';
import './phase-a.css';
import './phase-a-plus.css';
import './phase-b.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><StoreProvider><App /></StoreProvider></BrowserRouter></StrictMode>
);
