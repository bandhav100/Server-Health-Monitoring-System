import { Typography, Box, Container } from '@mui/material';

export default function ProfilePage() {
  return (
    <Container maxWidth={false} disableGutters>
      <Box sx={{ py: 1 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
          User Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your account details, security preferences, and API access tokens.
        </Typography>
      </Box>
    </Container>
  );
}
