import { Card, CardContent, Typography, Box, Chip, Skeleton, alpha } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import DnsIcon from '@mui/icons-material/Dns';

const ICON_MAP = {
  cpu: MemoryIcon,
  memory: DnsIcon,
  disk: StorageIcon,
  network: SpeedIcon,
};

const STATUS_COLOR_MAP = {
  normal: { bg: '#10B981', color: '#10B981', label: 'Normal' },
  warning: { bg: '#F59E0B', color: '#F59E0B', label: 'Warning' },
  critical: { bg: '#EF4444', color: '#EF4444', label: 'Critical' },
};

export default function MetricCard({ title, metricKey, rawValue, unit, status, details, change, isLoading }) {
  if (isLoading) {
    return (
      <Card
        sx={{
          bgcolor: '#111827',
          border: '1px solid #1F2937',
          borderRadius: 2.5,
          p: 1,
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: '#1F2937' }} />
          <Skeleton variant="rectangular" width="80%" height={42} sx={{ bgcolor: '#1F2937', my: 1, borderRadius: 1 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: '#1F2937' }} />
        </CardContent>
      </Card>
    );
  }

  const IconComponent = ICON_MAP[metricKey] || MemoryIcon;
  const isAvailable = rawValue !== null && rawValue !== undefined && rawValue !== '';
  const displayValue = isAvailable ? String(rawValue) : 'Unavailable';
  const displayUnit = unit ? String(unit) : '';
  const displayDetails = details ? String(details) : 'Unavailable';
  const statusInfo = status && STATUS_COLOR_MAP[status?.toLowerCase()] ? STATUS_COLOR_MAP[status.toLowerCase()] : null;

  return (
    <Card
      sx={{
        bgcolor: '#111827',
        border: '1px solid #1F2937',
        borderRadius: 2.5,
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        '&:hover': {
          borderColor: 'rgba(59, 130, 246, 0.4)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha('#3B82F6', 0.1),
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>

          {statusInfo ? (
            <Chip
              label={statusInfo.label}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6875rem',
                fontWeight: 700,
                bgcolor: alpha(statusInfo.bg, 0.12),
                color: statusInfo.color,
                border: `1px solid ${alpha(statusInfo.bg, 0.3)}`,
              }}
            />
          ) : (
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
              {status ? String(status) : 'Unavailable'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: isAvailable ? '#F8FAFC' : '#94A3B8',
              letterSpacing: '-0.02em',
              fontSize: isAvailable ? '1.75rem' : '1.25rem',
            }}
          >
            {displayValue}
          </Typography>
          {isAvailable && displayUnit && (
            <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              {displayUnit}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
            {displayDetails}
          </Typography>

          {change && (
            <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 600 }}>
              {String(change)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
