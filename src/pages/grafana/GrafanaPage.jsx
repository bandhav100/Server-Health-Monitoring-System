import { useState, useRef } from 'react';
import {
  Typography,
  Box,
  Container,
  Card,
  Button,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import AnalyticsIcon from '@mui/icons-material/Analytics';

export default function GrafanaPage() {
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000';
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setIsError(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const handleOpenExternal = () => {
    if (grafanaUrl) {
      window.open(grafanaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Controls */}
      <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <AnalyticsIcon sx={{ color: '#3B82F6', fontSize: 28 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              Grafana Dashboards
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Embedded Grafana telemetry visualizations from {grafanaUrl}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Reload Grafana Frame">
            <IconButton
              size="small"
              onClick={handleRetry}
              disabled={isLoading}
              sx={{
                color: '#94A3B8',
                border: '1px solid #1F2937',
                bgcolor: '#111827',
                '&:hover': { bgcolor: '#1F2937', color: '#F8FAFC' },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}>
            <IconButton
              size="small"
              onClick={handleToggleFullscreen}
              sx={{
                color: '#94A3B8',
                border: '1px solid #1F2937',
                bgcolor: '#111827',
                '&:hover': { bgcolor: '#1F2937', color: '#F8FAFC' },
              }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenExternal}
            sx={{
              borderColor: '#1F2937',
              color: '#3B82F6',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#3B82F6',
                bgcolor: 'rgba(59, 130, 246, 0.08)',
              },
            }}
          >
            Open in Grafana
          </Button>
        </Box>
      </Box>

      {/* Unavailable / Configuration Warning Banner */}
      {(!grafanaUrl || isError) && (
        <Alert
          severity="warning"
          sx={{
            mb: 2.5,
            bgcolor: '#1E1B13',
            color: '#FCD34D',
            border: '1px solid #78350F',
            '& .MuiAlert-icon': { color: '#F59E0B' },
          }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry Connection
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Grafana Connection Issue</AlertTitle>
          Unable to connect to Grafana instance at <strong>{grafanaUrl}</strong>. Ensure Grafana is running locally on port 3000 and has <code>allow_embedding = true</code> enabled in <code>grafana.ini</code>.
        </Alert>
      )}

      {/* Embedded Grafana Iframe Container */}
      <Paper
        ref={containerRef}
        elevation={0}
        sx={{
          flexGrow: 1,
          minHeight: 'calc(100vh - 220px)',
          bgcolor: '#0B0F19',
          border: '1px solid #1F2937',
          borderRadius: 2.5,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#0B0F19',
              zIndex: 2,
              gap: 2,
            }}
          >
            <CircularProgress color="primary" size={36} />
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              Connecting to Grafana at {grafanaUrl}...
            </Typography>
          </Box>
        )}

        {/* Embedded Iframe */}
        {grafanaUrl && (
          <Box
            component="iframe"
            key={iframeKey}
            src={`${grafanaUrl}/?kiosk=tv`}
            title="Embedded Grafana Dashboard"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: 'calc(100vh - 220px)',
              border: 'none',
              bgcolor: '#0B0F19',
              flexGrow: 1,
            }}
          />
        )}
      </Paper>
    </Container>
  );
}
