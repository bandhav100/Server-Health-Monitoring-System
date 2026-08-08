import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  useServersData,
  useCreateServerMutation,
  useUpdateServerMutation,
  useDeleteServerMutation,
} from '../../hooks/useServersData';

const STATUS_MAP = {
  online: { color: '#10B981', label: 'ONLINE' },
  healthy: { color: '#10B981', label: 'HEALTHY' },
  warning: { color: '#F59E0B', label: 'WARNING' },
  offline: { color: '#EF4444', label: 'OFFLINE' },
  unhealthy: { color: '#EF4444', label: 'UNHEALTHY' },
};

export default function ServersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [formData, setFormData] = useState({ name: '', ipAddress: '', region: '', status: 'online' });

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Queries & Mutations
  const { data: serversData, isLoading, isError, error, refetch } = useServersData();
  const createMutation = useCreateServerMutation();
  const updateMutation = useUpdateServerMutation();
  const deleteMutation = useDeleteServerMutation();

  // Safely extract servers array from API response
  const serversList = Array.isArray(serversData)
    ? serversData
    : Array.isArray(serversData?.servers)
    ? serversData.servers
    : Array.isArray(serversData?.content)
    ? serversData.content
    : Array.isArray(serversData?.items)
    ? serversData.items
    : [];

  const filteredServers = serversList.filter((srv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (srv.name || srv.hostname || srv.id || '').toLowerCase();
    const ip = (srv.ipAddress || srv.ip || '').toLowerCase();
    const region = (srv.region || srv.location || '').toLowerCase();
    const status = (srv.status || '').toLowerCase();
    return name.includes(q) || ip.includes(q) || region.includes(q) || status.includes(q);
  });

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingServer(null);
    setFormData({ name: '', ipAddress: '', region: '', status: 'online' });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (srv) => {
    setEditingServer(srv);
    setFormData({
      name: srv.name || srv.hostname || srv.id || '',
      ipAddress: srv.ipAddress || srv.ip || '',
      region: srv.region || srv.location || '',
      status: srv.status || 'online',
    });
    setIsFormOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (editingServer) {
      const targetId = editingServer.id || editingServer.name;
      updateMutation.mutate(
        { id: targetId, data: formData },
        {
          onSuccess: () => setIsFormOpen(false),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  // Trigger Delete Confirmation
  const handlePromptDelete = (srv) => {
    setDeleteConfirmTarget(srv);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const targetId = deleteConfirmTarget.id || deleteConfirmTarget.name;
    deleteMutation.mutate(targetId, {
      onSuccess: () => setDeleteConfirmTarget(null),
    });
  };

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }} gutterBottom>
            Servers Overview
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and monitor all registered server instances across environments.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
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
            Refresh
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              bgcolor: '#2563EB',
              fontWeight: 600,
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            Add Server
          </Button>
        </Box>
      </Box>

      {/* Error & Retry Banner */}
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
          <AlertTitle sx={{ fontWeight: 700 }}>Failed to load servers</AlertTitle>
          {error?.message || 'Unable to connect to backend server at http://localhost:8081'}
        </Alert>
      )}

      {/* Servers Summary Metrics */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <StorageIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Total Registered Servers
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {serversList.length > 0 ? serversList.length : 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <StorageIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Healthy / Online Servers
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
                    {serversList.filter(s => (s.status || '').toLowerCase() === 'online' || (s.status || '').toLowerCase() === 'healthy').length || 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <StorageIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Warning / Offline Servers
                </Typography>
                {isLoading ? (
                  <Skeleton width={60} height={28} sx={{ bgcolor: '#1F2937' }} />
                ) : (
                  <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700 }}>
                    {serversList.filter(s => (s.status || '').toLowerCase() !== 'online' && (s.status || '').toLowerCase() !== 'healthy').length || 'Unavailable'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table & Search */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
            Registered Nodes List
          </Typography>

          <TextField
            placeholder="Search by server name, IP or region..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748B', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 280,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0D131F',
                fontSize: '0.8125rem',
                color: '#F8FAFC',
                '& fieldset': { borderColor: '#1F2937' },
                '&:hover fieldset': { borderColor: '#3B82F6' },
              },
            }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { borderColor: '#1F2937', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 } }}>
                <TableCell>Server Name / ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>CPU / Memory Load</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row} sx={{ '& td': { borderColor: '#1F2937', py: 1.5 } }}>
                    <TableCell><Skeleton width={120} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={100} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={70} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell><Skeleton width={90} height={20} sx={{ bgcolor: '#1F2937' }} /></TableCell>
                    <TableCell align="right"><Skeleton width={90} height={24} sx={{ bgcolor: '#1F2937', ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredServers.length > 0 ? (
                filteredServers.map((srv, idx) => {
                  const srvId = srv.id || srv.name || `srv-${idx + 1}`;
                  const name = srv.name || srv.hostname || srv.id || 'Unavailable';
                  const ip = srv.ipAddress || srv.ip || 'Unavailable';
                  const region = srv.region || srv.location || 'Unavailable';
                  const stKey = (srv.status || 'online').toLowerCase();
                  const statusInfo = STATUS_MAP[stKey] || { color: '#94A3B8', label: (srv.status || 'ONLINE').toUpperCase() };
                  const cpuLoad = srv.cpuLoad || srv.cpuUsage ? `${srv.cpuLoad || srv.cpuUsage}%` : 'Unavailable';
                  const ramLoad = srv.ramLoad || srv.memoryUsage ? `${srv.ramLoad || srv.memoryUsage}%` : 'Unavailable';

                  return (
                    <TableRow key={srv.id || idx} sx={{ '& td': { borderColor: '#1F2937', py: 1.25 } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          ID: {srvId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {ip}
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {region}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            bgcolor: alpha(statusInfo.color, 0.12),
                            color: statusInfo.color,
                            border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {cpuLoad} / {ramLoad}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/servers/${srvId}`)}
                              sx={{ color: '#3B82F6', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Server">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(srv)}
                              sx={{ color: '#F59E0B', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)' } }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Server">
                            <IconButton
                              size="small"
                              onClick={() => handlePromptDelete(srv)}
                              sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow sx={{ '& td': { borderColor: '#1F2937' } }}>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748B', fontSize: '0.875rem' }}>
                    No servers found matching query from GET /api/servers
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Server Modal Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0D131F',
            color: '#F8FAFC',
            border: '1px solid #1F2937',
            borderRadius: 2.5,
            minWidth: 360,
          },
        }}
      >
        <form onSubmit={handleSaveForm}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editingServer ? 'Edit Server Configuration' : 'Register New Server'}
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Server Name / Hostname"
                variant="outlined"
                size="small"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiOutlinedInput-root': {
                    color: '#F8FAFC',
                    '& fieldset': { borderColor: '#1F2937' },
                    '&:hover fieldset': { borderColor: '#3B82F6' },
                  },
                }}
              />

              <TextField
                label="IP Address"
                variant="outlined"
                size="small"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiOutlinedInput-root': {
                    color: '#F8FAFC',
                    '& fieldset': { borderColor: '#1F2937' },
                    '&:hover fieldset': { borderColor: '#3B82F6' },
                  },
                }}
              />

              <TextField
                label="Region / Location"
                variant="outlined"
                size="small"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiOutlinedInput-root': {
                    color: '#F8FAFC',
                    '& fieldset': { borderColor: '#1F2937' },
                    '&:hover fieldset': { borderColor: '#3B82F6' },
                  },
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} sx={{ color: '#94A3B8' }}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              startIcon={(createMutation.isLoading || updateMutation.isLoading) && <CircularProgress size={14} color="inherit" />}
              sx={{ bgcolor: '#2563EB', fontWeight: 600, '&:hover': { bgcolor: '#1D4ED8' } }}
            >
              {editingServer ? 'Save Changes' : 'Create Server'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmTarget)}
        onClose={() => setDeleteConfirmTarget(null)}
        PaperProps={{
          sx: {
            bgcolor: '#0D131F',
            color: '#F8FAFC',
            border: '1px solid #7F1D1D',
            borderRadius: 2.5,
            maxWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#EF4444' }}>
          Confirm Server Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Are you sure you want to delete server instance{' '}
            <strong style={{ color: '#F8FAFC' }}>
              {deleteConfirmTarget?.name || deleteConfirmTarget?.hostname || deleteConfirmTarget?.id}
            </strong>
            ? This action will invoke <code style={{ color: '#EF4444' }}>DELETE /api/servers/&#123;id&#125;</code>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteConfirmTarget(null)} sx={{ color: '#94A3B8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isLoading}
            startIcon={deleteMutation.isLoading && <CircularProgress size={14} color="inherit" />}
            sx={{ fontWeight: 600 }}
          >
            Delete Server
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
