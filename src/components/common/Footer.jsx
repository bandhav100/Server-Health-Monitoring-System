import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        px: 3,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? '#0B0F19' : theme.palette.background.paper,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justify: 'space-between',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 8px #10B981',
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          System Normal • All Monitoring Agents Connected
        </Typography>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '0.75rem', textAlign: { xs: 'center', sm: 'right' }, flexGrow: 1 }}
      >
        SHMS Enterprise v1.0.0 &copy; {new Date().getFullYear()} Server Health Monitoring System
      </Typography>
    </Box>
  );
}
