import { Typography, Box, Container } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function AlertDetailPage() {
  const { alertId } = useParams();

  return (
    <Container maxWidth={false} disableGutters>
      <Box sx={{ py: 1 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
          Alert Incident Details {alertId ? `(${alertId})` : ''}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Inspect diagnostic logs and root cause data for this alert incident.
        </Typography>
      </Box>
    </Container>
  );
}
