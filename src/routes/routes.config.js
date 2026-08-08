import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EmailIcon from '@mui/icons-material/Email';

export const ROUTES = {
  PUBLIC: {
    LOGIN: '/login',
  },
  PROTECTED: {
    DASHBOARD: '/dashboard',
    SERVERS: '/servers',
    SERVER_DETAIL: '/servers/:serverId',
    ALERTS: '/alerts',
    ALERT_DETAIL: '/alerts/:alertId',
    METRICS: '/metrics',
    PREDICTIONS: '/predictions',
    REPORTS: '/reports',
    GRAFANA: '/grafana',
    EMAIL: '/email',
    SETTINGS: '/settings',
    PROFILE: '/profile',
  },
};

export const NAVIGATION_ITEMS = [
  {
    title: 'Dashboard',
    path: ROUTES.PROTECTED.DASHBOARD,
    icon: DashboardIcon,
  },
  {
    title: 'Servers',
    path: ROUTES.PROTECTED.SERVERS,
    icon: StorageIcon,
  },
  {
    title: 'Alerts',
    path: ROUTES.PROTECTED.ALERTS,
    icon: NotificationsActiveIcon,
  },
  {
    title: 'Metrics',
    path: ROUTES.PROTECTED.METRICS,
    icon: AssessmentIcon,
  },
  {
    title: 'Predictions',
    path: ROUTES.PROTECTED.PREDICTIONS,
    icon: PsychologyIcon,
  },
  {
    title: 'Reports',
    path: ROUTES.PROTECTED.REPORTS,
    icon: SummarizeIcon,
  },
  {
    title: 'Grafana',
    path: ROUTES.PROTECTED.GRAFANA,
    icon: AnalyticsIcon,
  },
  {
    title: 'Email Center',
    path: ROUTES.PROTECTED.EMAIL,
    icon: EmailIcon,
  },
  {
    title: 'Settings',
    path: ROUTES.PROTECTED.SETTINGS,
    icon: SettingsIcon,
  },
  {
    title: 'Profile',
    path: ROUTES.PROTECTED.PROFILE,
    icon: AccountCircleIcon,
  },
];
