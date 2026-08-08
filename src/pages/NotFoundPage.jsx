import { Typography, Box, Container } from '@mui/material';

export default function NotFoundPage() {
  return (
    <Container maxWidth={false} disableGutters>
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          The requested page does not exist or has been moved.
        </Typography>
      </Box>
    </Container>
  );
}
