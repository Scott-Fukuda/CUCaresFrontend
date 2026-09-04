import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// Launch-day tuning: if the backend is struggling, the default 3 retries per
// query from every client multiplies load exactly when it is weakest. One retry
// still rides out a blip; staleTime keeps a tab switch from refetching the world.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
