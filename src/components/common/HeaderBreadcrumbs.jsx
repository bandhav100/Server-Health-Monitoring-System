import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

const PATH_LABELS = {
  dashboard: 'Dashboard',
  servers: 'Servers',
  alerts: 'Alerts',
  metrics: 'Metrics',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'Profile',
  predictions: 'Predictions',
  notifications: 'Notifications',
  login: 'Login',
};

export default function HeaderBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" sx={{ color: '#64748B' }} />}
      aria-label="breadcrumb"
      sx={{
        display: { xs: 'none', sm: 'flex' },
        alignItems: 'center',
        '& .MuiBreadcrumbs-li': {
          display: 'flex',
          alignItems: 'center',
        },
      }}
    >
      <Link
        component={RouterLink}
        to="/dashboard"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: '#94A3B8',
          fontSize: '0.8125rem',
          fontWeight: 500,
          textDecoration: 'none',
          '&:hover': {
            color: '#3B82F6',
          },
        }}
      >
        <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
        Home
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = PATH_LABELS[value] || value;

        return last ? (
          <Typography
            key={to}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#F8FAFC',
              textTransform: 'capitalize',
            }}
          >
            {label}
          </Typography>
        ) : (
          <Link
            key={to}
            component={RouterLink}
            to={to}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#94A3B8',
              textDecoration: 'none',
              textTransform: 'capitalize',
              '&:hover': {
                color: '#3B82F6',
              },
            }}
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
