import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { queryClient } from './config/queryClient';
import { ColorModeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer position="top-right" theme="dark" autoClose={3000} />
        </AuthProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  );
}
