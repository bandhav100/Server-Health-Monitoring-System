import { Typography, Box, Container } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function ServerDetailPage() {
  const { serverId } = useParams();

  return (
    <Container maxWidth={false} disableGutters>
      <Box sx={{ py: 1 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
          Server Details {serverId ? `(${serverId})` : ''}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View telemetry, specifications, and hardware status for this server node.
        </Typography>
      </Box>
    </Container>
  );
}
