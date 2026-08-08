import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'dark') =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            background: {
              default: '#0B0F19',
              paper: '#111827',
              sidebar: '#0D131F',
            },
            primary: {
              main: '#3B82F6',
              light: '#60A5FA',
              dark: '#2563EB',
              contrastText: '#FFFFFF',
            },
            secondary: {
              main: '#10B981',
              light: '#34D399',
              dark: '#059669',
            },
            error: {
              main: '#EF4444',
            },
            warning: {
              main: '#F59E0B',
            },
            info: {
              main: '#06B6D4',
            },
            success: {
              main: '#10B981',
            },
            text: {
              primary: '#F9FAFB',
              secondary: '#9CA3AF',
            },
            divider: '#1F2937',
          }
        : {
            background: {
              default: '#F8FAFC',
              paper: '#FFFFFF',
              sidebar: '#1E293B',
            },
            primary: {
              main: '#2563EB',
              light: '#3B82F6',
              dark: '#1D4ED8',
              contrastText: '#FFFFFF',
            },
            secondary: {
              main: '#059669',
            },
            text: {
              primary: '#0F172A',
              secondary: '#64748B',
            },
            divider: '#E2E8F0',
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      body2: {
        fontSize: '0.8125rem',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: mode === 'dark' ? '#374151 #0B0F19' : '#CBD5E1 #F8FAFC',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 4,
              backgroundColor: mode === 'dark' ? '#374151' : '#CBD5E1',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
