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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import { usePredictionsData } from '../../hooks/usePredictionsData';

const RISK_COLOR_MAP = {
  low: { color: '#10B981', label: 'LOW RISK' },
  medium: { color: '#F59E0B', label: 'MEDIUM RISK' },
  high: { color: '#EF4444', label: 'HIGH RISK' },
  critical: { color: '#DC2626', label: 'CRITICAL RISK' },
};

const getDisplayVal = (val, suffix = '') => {
  if (val === null || val === undefined || val === '') return 'Unavailable';
  return `${val}${suffix}`;
};

export default function PredictionsPage() {
  const { data, isLoading, isError, error, refetch } = usePredictionsData();

  // Extract predictions list safely from API response
  const predictionsList = Array.isArray(data)
    ? data
    : Array.isArray(data?.predictions)
    ? data.predictions
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.serverPredictions)
    ? data.serverPredictions
    : [];

  // Extract overall metrics / summary safely
  const cpuSummary = data?.cpu || data?.cpuPrediction || {};
  const memSummary = data?.memory || data?.memoryPrediction || {};
  const diskSummary = data?.disk || data?.diskPrediction || {};

  const currentCpu = data?.currentCpu ?? cpuSummary?.current ?? cpuSummary?.currentValue;
  const predictedCpu = data?.predictedCpu ?? cpuSummary?.predicted ?? cpuSummary?.predictedValue;

  const currentMemory = data?.currentMemory ?? memSummary?.current ?? memSummary?.currentValue;
  const predictedMemory = data?.predictedMemory ?? memSummary?.predicted ?? memSummary?.predictedValue;

  const currentDisk = data?.currentDisk ?? diskSummary?.current ?? diskSummary?.currentValue;
  const predictedDisk = data?.predictedDisk ?? diskSummary?.predicted ?? diskSummary?.predictedValue;

  const overallConfidence = data?.confidence ?? data?.confidenceScore ?? data?.accuracy;
  const overallRisk = data?.risk ?? data?.riskLevel ?? data?.overallRisk;
  const overallRecommendation = data?.recommendation ?? data?.suggestedAction ?? data?.actionItem;

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }} gutterBottom>
            Predictive Health Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            AI-driven load forecasting, bottleneck risk detection, and resource recommendations.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
          sx={{
            borderColor: '#1F2937',
            color: '#94A3B8',
            '&:hover': {
              borderColor: '#3B82F6',
              color: '#F8FAFC',
              bgcolor: 'rgba(59, 130, 246, 0.08)',
            },
          }}
        >
          Refresh Predictions
        </Button>
      </Box>

      {/* Error & Retry State Banner */}
      {isError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: '#1E1215',
            color: '#FCA5A5',
            border: '1px solid #7F1D1D',
            '& .MuiAlert-icon': { color: '#EF4444' },
          }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Failed to load predictions</AlertTitle>
          {error?.message || 'Unable to connect to prediction service via GET /api/predictions/dashboard'}
        </Alert>
      )}

      {/* Top Summary Cards (Current vs Predicted CPU, Memory, Disk) */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* CPU Prediction Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  <MemoryIcon />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  CPU Load Forecast
                </Typography>
              </Box>
            </Box>

            {isLoading ? (
              <Skeleton height={80} sx={{ bgcolor: '#1F2937' }} />
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Current CPU
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                    {getDisplayVal(currentCpu, '%')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Predicted CPU
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                    {getDisplayVal(predictedCpu, '%')}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>

        {/* Memory Prediction Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <DnsIcon />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  Memory Forecast
                </Typography>
              </Box>
            </Box>

            {isLoading ? (
              <Skeleton height={80} sx={{ bgcolor: '#1F2937' }} />
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Current Memory
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                    {getDisplayVal(currentMemory, '%')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Predicted Memory
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981' }}>
                    {getDisplayVal(predictedMemory, '%')}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>

        {/* Disk Prediction Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  <StorageIcon />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  Storage Forecast
                </Typography>
              </Box>
            </Box>

            {isLoading ? (
              <Skeleton height={80} sx={{ bgcolor: '#1F2937' }} />
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Current Disk
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                    {getDisplayVal(currentDisk, '%')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Predicted Disk
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                    {getDisplayVal(predictedDisk, '%')}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Model Confidence, Risk & Recommendation Banner */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <PsychologyIcon sx={{ color: '#8B5CF6', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                Model Confidence Score
              </Typography>
            </Box>
            {isLoading ? (
              <Skeleton width="80%" height={30} sx={{ bgcolor: '#1F2937' }} />
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Confidence Level
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8B5CF6', fontWeight: 700 }}>
                    {getDisplayVal(overallConfidence, '%')}
                  </Typography>
                </Box>
                {typeof overallConfidence === 'number' && (
                  <LinearProgress
                    variant="determinate"
                    value={overallConfidence}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6', borderRadius: 4 },
                    }}
                  />
                )}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
              Overall Infrastructure Risk Level
            </Typography>
            {isLoading ? (
              <Skeleton width={100} height={32} sx={{ bgcolor: '#1F2937' }} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {overallRisk ? (
                  <Chip
                    label={(RISK_COLOR_MAP[overallRisk.toLowerCase()] || {}).label || String(overallRisk).toUpperCase()}
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha((RISK_COLOR_MAP[overallRisk.toLowerCase()] || {}).color || '#3B82F6', 0.15),
                      color: (RISK_COLOR_MAP[overallRisk.toLowerCase()] || {}).color || '#3B82F6',
                      border: `1px solid ${alpha((RISK_COLOR_MAP[overallRisk.toLowerCase()] || {}).color || '#3B82F6', 0.3)}`,
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                    Unavailable
                  </Typography>
                )}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
              System Recommendation
            </Typography>
            {isLoading ? (
              <Skeleton width="100%" height={24} sx={{ bgcolor: '#1F2937' }} />
            ) : (
              <Typography variant="body2" sx={{ color: overallRecommendation ? '#F8FAFC' : '#94A3B8', fontWeight: 500 }}>
                {overallRecommendation ? String(overallRecommendation) : 'Unavailable'}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Card>

      {/* Server Predictive Health Table */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
            Node-level Predictive Risk Matrix
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Forecasted resource load, risk classification, and recommended action per server node
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 } }}>
                <TableCell>Server Node</TableCell>
                <TableCell>Cur / Pred CPU</TableCell>
                <TableCell>Cur / Pred Memory</TableCell>
                <TableCell>Cur / Pred Disk</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Recommendation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4].map((row) => (
                  <TableRow key={row} sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell><Skeleton width={120} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={60} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={150} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                  </TableRow>
                ))
              ) : predictionsList.length > 0 ? (
                predictionsList.map((item, idx) => {
                  const nodeName = item.serverName || item.serverId || item.hostname || item.node || 'Unavailable';
                  const cCpu = getDisplayVal(item.currentCpu ?? item.cpuCurrent, '%');
                  const pCpu = getDisplayVal(item.predictedCpu ?? item.cpuPredicted, '%');
                  const cMem = getDisplayVal(item.currentMemory ?? item.memoryCurrent, '%');
                  const pMem = getDisplayVal(item.predictedMemory ?? item.memoryPredicted, '%');
                  const cDisk = getDisplayVal(item.currentDisk ?? item.diskCurrent, '%');
                  const pDisk = getDisplayVal(item.predictedDisk ?? item.diskPredicted, '%');
                  const conf = getDisplayVal(item.confidence ?? item.confidenceScore, '%');
                  const riskKey = (item.risk || item.riskLevel || 'low').toLowerCase();
                  const riskInfo = RISK_COLOR_MAP[riskKey] || { color: '#94A3B8', label: (item.risk || 'LOW').toUpperCase() };
                  const rec = item.recommendation || item.action || item.suggestedAction || 'Unavailable';

                  return (
                    <TableRow key={item.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {nodeName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {cCpu} / <span style={{ color: '#3B82F6', fontWeight: 600 }}>{pCpu}</span>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {cMem} / <span style={{ color: '#10B981', fontWeight: 600 }}>{pMem}</span>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {cDisk} / <span style={{ color: '#F59E0B', fontWeight: 600 }}>{pDisk}</span>
                      </TableCell>
                      <TableCell sx={{ color: '#8B5CF6', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {conf}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={riskInfo.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            bgcolor: alpha(riskInfo.color, 0.12),
                            color: riskInfo.color,
                            border: `1px solid ${alpha(riskInfo.color, 0.3)}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {rec}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748B', fontSize: '0.875rem' }}>
                    No prediction forecast data available from GET /api/predictions/dashboard
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
