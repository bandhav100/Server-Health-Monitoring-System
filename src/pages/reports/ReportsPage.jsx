import { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  Card,
  Grid,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  alpha,
} from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('system_health');
  const [timeRange, setTimeRange] = useState('24h');
  const [exportFormat, setExportFormat] = useState('pdf');

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }} gutterBottom>
            Analytics & System Reports
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Configure telemetry reports, export metrics to PDF or CSV, and view generation history.
          </Typography>
        </Box>

        <Chip
          icon={<LockIcon sx={{ fontSize: '14px !important', color: '#F59E0B !important' }} />}
          label="Backend Integration Pending"
          sx={{
            bgcolor: alpha('#F59E0B', 0.12),
            color: '#F59E0B',
            fontWeight: 700,
            fontSize: '0.75rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        />
      </Box>

      {/* Integration Notice Alert */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          mb: 3,
          bgcolor: '#0D131F',
          color: '#93C5FD',
          border: '1px solid #1E3A8A',
          '& .MuiAlert-icon': { color: '#60A5FA' },
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, color: '#F8FAFC' }}>
          Report Generator Notice
        </AlertTitle>
        No Report API is currently documented in the backend specification. Report actions (Generate, PDF/CSV Export, and Download History) are UI-configured and ready to connect once backend endpoints are available.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 1. Generate Report Configuration Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <SummarizeIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '1rem' }}>
                  Generate New Report
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Select telemetry parameters and time window for export
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#94A3B8' }}>Report Category</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Category"
                    onChange={(e) => setReportType(e.target.value)}
                    sx={{
                      color: '#F8FAFC',
                      bgcolor: '#0D131F',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1F2937' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                    }}
                  >
                    <MenuItem value="system_health">System Health Overview</MenuItem>
                    <MenuItem value="metrics_telemetry">Metrics & Performance Logs</MenuItem>
                    <MenuItem value="alerts_incident">Incidents & Alerts Log</MenuItem>
                    <MenuItem value="predictive_audit">Predictive Risk Audit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#94A3B8' }}>Time Window</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Window"
                    onChange={(e) => setTimeRange(e.target.value)}
                    sx={{
                      color: '#F8FAFC',
                      bgcolor: '#0D131F',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1F2937' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                    }}
                  >
                    <MenuItem value="24h">Last 24 Hours</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Quarterly (90 Days)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#94A3B8' }}>Default Format</InputLabel>
                  <Select
                    value={exportFormat}
                    label="Default Format"
                    onChange={(e) => setExportFormat(e.target.value)}
                    sx={{
                      color: '#F8FAFC',
                      bgcolor: '#0D131F',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1F2937' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                    }}
                  >
                    <MenuItem value="pdf">PDF Document (.pdf)</MenuItem>
                    <MenuItem value="csv">CSV Spreadsheet (.csv)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #1F2937', display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Report API required from backend before generating reports" arrow>
                <span>
                  <Button
                    variant="contained"
                    disabled
                    startIcon={<SummarizeIcon />}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      color: '#64748B',
                      fontWeight: 600,
                    }}
                  >
                    Generate Report (Backend Required)
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Card>
        </Grid>

        {/* 2. Export Actions Section */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <PictureAsPdfIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '1rem' }}>
                  Direct Export Tools
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Instant export triggers for current dashboard view
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <Tooltip title="Backend export PDF endpoint required" arrow>
                <span>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    startIcon={<PictureAsPdfIcon sx={{ color: '#EF4444' }} />}
                    sx={{
                      py: 1.25,
                      borderColor: '#1F2937',
                      color: '#64748B',
                      justifyContent: 'flex-start',
                      px: 2,
                    }}
                  >
                    Export PDF Document (Backend Required)
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title="Backend export CSV endpoint required" arrow>
                <span>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    startIcon={<TableChartIcon sx={{ color: '#10B981' }} />}
                    sx={{
                      py: 1.25,
                      borderColor: '#1F2937',
                      color: '#64748B',
                      justifyContent: 'flex-start',
                      px: 2,
                    }}
                  >
                    Export CSV Dataset (Backend Required)
                  </Button>
                </span>
              </Tooltip>
            </Stack>

            <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px stroke rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.5 }}>
                • PDF exports format telemetry graphs and summary cards into printable executive reports.<br />
                • CSV exports output raw metric timestamps, values, and server IDs for Excel analytics.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Download History Table Section */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HistoryIcon sx={{ color: '#8B5CF6', fontSize: 22 }} />
          <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
            Report Download History
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 } }}>
                <TableCell>Report Name</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Time Window</TableCell>
                <TableCell>Date Generated</TableCell>
                <TableCell>File Size</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748B', fontSize: '0.875rem' }}>
                  No download history available. Report history API is not connected.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}

// Tooltip helper component wrapper
function Tooltip({ children, title, arrow }) {
  return (
    <Box sx={{ width: '100%' }}>
      {children}
    </Box>
  );
}
