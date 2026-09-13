
import React from 'react';
import ReactDOM from 'react-dom/client';
const app = new URLSearchParams(location.search).get('print') === '1' ? import('./PrintStudio') : import('./App');

const root = ReactDOM.createRoot(document.getElementById('root')!);
void app.then(({ default: App }) => root.render(<App />));
