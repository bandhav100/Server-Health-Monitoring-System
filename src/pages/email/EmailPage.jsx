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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Paper,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const TEMPLATES = {
  alert_critical: {
    title: 'CRITICAL Alert Notification',
    subject: '[SHMS CRITICAL] High CPU/Memory Utilization Alert on {{server_id}}',
    body: 'Attention Infrastructure Team,\n\nA CRITICAL severity threshold has been triggered on server {{server_id}} ({{ip_address}}).\n\nMetric: CPU Load > 90%\nTimestamp: {{timestamp}}\nStatus: UNRESOLVED\n\nPlease log into the SHMS Dashboard immediately to inspect telemetry and resolve.',
  },
  weekly_digest: {
    title: 'Weekly Infrastructure Summary',
    subject: '[SHMS Weekly] System Performance & Uptime Digest (Week {{week_number}})',
    body: 'Dear Operations Team,\n\nAttached is the weekly performance digest for all registered server nodes.\n\nSummary:\n• Overall System Uptime: 99.94%\n• Total Resolved Alerts: {{alert_count}}\n• Peak Network Throughput: {{peak_throughput}} MB/s\n\nDetailed breakdown is available in the attached PDF report.',
  },
  monthly_audit: {
    title: 'Monthly Executive Uptime Audit',
    subject: '[SHMS Executive] Monthly Infrastructure Audit & SLA Compliance Report',
    body: 'Executive Team,\n\nThe monthly system health and SLA compliance report for {{month_name}} {{year}} is now ready.\n\nHighlights:\n• SLA Target: 99.9% | Achieved Uptime: 99.98%\n• Mean Time to Resolution (MTTR): 4m 12s\n• Active Server Count: {{server_count}} nodes',
  },
};

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('alert_critical');
  
  // Compose Form Fields
  const [recipient, setRecipient] = useState('ops-team@shms.enterprise.io');
  const [ccRecipient, setCcRecipient] = useState('');
  const [subject, setSubject] = useState(TEMPLATES.alert_critical.subject);
  const [bodyText, setBodyText] = useState(TEMPLATES.alert_critical.body);
  const [attachmentName, setAttachmentName] = useState('');

  // Handle Template Selection
  const handleTemplateChange = (tmplKey) => {
    setSelectedTemplate(tmplKey);
    const tmpl = TEMPLATES[tmplKey];
    if (tmpl) {
      setSubject(tmpl.subject);
      setBodyText(tmpl.body);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <EmailIcon sx={{ color: '#3B82F6', fontSize: 28 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              Email Dispatch & Notification Center
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Configure automated alert dispatches, weekly digests, monthly SLA audits, and email templates.
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
          Email Center Notice
        </AlertTitle>
        No Email Dispatch API (SMTP / SES) is currently documented in backend specs. All email composition, templates, weekly/monthly schedules, and attachment UI controls are configured and ready to connect once backend endpoints are available.
      </Alert>

      {/* Email Dashboard KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <EmailIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Total Email Dispatches
                </Typography>
                <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.9rem' }}>
                  Backend Required
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <NotificationsActiveIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Alert Dispatch Rules
                </Typography>
                <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.9rem' }}>
                  Backend Required
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <DateRangeIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Weekly Report Schedule
                </Typography>
                <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.9rem' }}>
                  Backend Required
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                <CalendarMonthIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Monthly SLA Schedule
                </Typography>
                <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.9rem' }}>
                  Backend Required
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Navigation */}
      <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 2.5, p: 2.5, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            minHeight: 40,
            mb: 2.5,
            borderBottom: '1px solid #1F2937',
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#94A3B8',
              '&.Mui-selected': { color: '#3B82F6' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#3B82F6' },
          }}
        >
          <Tab icon={<SendIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Compose & Dispatch" />
          <Tab icon={<DescriptionIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Templates" />
          <Tab icon={<NotificationsActiveIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Alert Emails" />
          <Tab icon={<DateRangeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Weekly Reports" />
          <Tab icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Monthly SLA Audits" />
        </Tabs>

        {/* Tab 0: Compose & Dispatch */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Compose Form */}
            <Grid item xs={12} lg={7}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#94A3B8' }}>Select Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    label="Select Template"
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    sx={{
                      color: '#F8FAFC',
                      bgcolor: '#0D131F',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1F2937' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                    }}
                  >
                    <MenuItem value="alert_critical">CRITICAL Alert Notification</MenuItem>
                    <MenuItem value="weekly_digest">Weekly Infrastructure Summary</MenuItem>
                    <MenuItem value="monthly_audit">Monthly Executive SLA Audit</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="To (Primary Recipient)"
                      size="small"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      sx={{
                        '& .MuiInputLabel-root': { color: '#94A3B8' },
                        '& .MuiOutlinedInput-root': {
                          color: '#F8FAFC',
                          bgcolor: '#0D131F',
                          '& fieldset': { borderColor: '#1F2937' },
                          '&:hover fieldset': { borderColor: '#3B82F6' },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CC / Additional Recipients"
                      size="small"
                      value={ccRecipient}
                      onChange={(e) => setCcRecipient(e.target.value)}
                      placeholder="devops@shms.io"
                      sx={{
                        '& .MuiInputLabel-root': { color: '#94A3B8' },
                        '& .MuiOutlinedInput-root': {
                          color: '#F8FAFC',
                          bgcolor: '#0D131F',
                          '& fieldset': { borderColor: '#1F2937' },
                          '&:hover fieldset': { borderColor: '#3B82F6' },
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Subject Line"
                  size="small"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                    '& .MuiOutlinedInput-root': {
                      color: '#F8FAFC',
                      bgcolor: '#0D131F',
                      '& fieldset': { borderColor: '#1F2937' },
                      '&:hover fieldset': { borderColor: '#3B82F6' },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Email Body Content"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                    '& .MuiOutlinedInput-root': {
                      color: '#F8FAFC',
                      bgcolor: '#0D131F',
                      fontSize: '0.875rem',
                      '& fieldset': { borderColor: '#1F2937' },
                      '&:hover fieldset': { borderColor: '#3B82F6' },
                    },
                  }}
                />

                {/* Attachments Section */}
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#0D131F', border: '1px solid #1F2937' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                        File Attachments
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<InsertDriveFileIcon />}
                      sx={{
                        borderColor: '#1F2937',
                        color: '#94A3B8',
                        fontSize: '0.75rem',
                        '&:hover': { borderColor: '#3B82F6', color: '#F8FAFC' },
                      }}
                    >
                      Choose File
                      <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                  </Box>

                  {attachmentName ? (
                    <Chip
                      icon={<InsertDriveFileIcon sx={{ fontSize: '14px !important', color: '#3B82F6 !important' }} />}
                      label={attachmentName}
                      onDelete={() => setAttachmentName('')}
                      sx={{
                        mt: 1.5,
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    />
                  ) : (
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                      No attachment selected. Attach diagnostic logs, metrics CSV, or PDF reports.
                    </Typography>
                  )}
                </Box>

                {/* Submit Action */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Tooltip title="Backend SMTP email endpoint required" arrow>
                    <span>
                      <Button
                        variant="contained"
                        disabled
                        startIcon={<SendIcon />}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          color: '#64748B',
                          fontWeight: 600,
                        }}
                      >
                        Send Email (Backend Integration Required)
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>

            {/* Email Live Preview Pane */}
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 2.5, bgcolor: '#0D131F', border: '1px solid #1F2937', borderRadius: 2.5, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: '1px solid #1F2937' }}>
                  <VisibilityIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    Live Email Render Preview
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: '#111827', borderRadius: 2, border: '1px solid #1F2937' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    To: <span style={{ color: '#F8FAFC' }}>{recipient || '—'}</span>
                  </Typography>
                  {ccRecipient && (
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      CC: <span style={{ color: '#94A3B8' }}>{ccRecipient}</span>
                    </Typography>
                  )}
                  <Typography variant="subtitle2" sx={{ color: '#3B82F6', fontWeight: 700, my: 1 }}>
                    Subject: {subject || '(No Subject)'}
                  </Typography>

                  <Divider sx={{ borderColor: '#1F2937', my: 1.5 }} />

                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      color: '#94A3B8',
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {bodyText || '(Empty Body)'}
                  </Typography>

                  {attachmentName && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px stroke #1F2937' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Attached File:
                      </Typography>
                      <Chip
                        icon={<InsertDriveFileIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                        label={attachmentName}
                        size="small"
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Templates */}
        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            {Object.keys(TEMPLATES).map((key) => {
              const tmpl = TEMPLATES[key];
              return (
                <Grid key={key} item xs={12} md={4}>
                  <Card sx={{ bgcolor: '#0D131F', border: '1px solid #1F2937', borderRadius: 2, p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 700, mb: 1 }}>
                      {tmpl.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#3B82F6', display: 'block', mb: 1.5, fontWeight: 600 }}>
                      {tmpl.subject}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        handleTemplateChange(key);
                        setActiveTab(0);
                      }}
                      sx={{ borderColor: '#1F2937', color: '#94A3B8', '&:hover': { borderColor: '#3B82F6', color: '#F8FAFC' } }}
                    >
                      Use Template
                    </Button>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Tab 2: Alert Emails Configuration */}
        {activeTab === 2 && (
          <Box sx={{ p: 2, bgcolor: '#0D131F', borderRadius: 2, border: '1px solid #1F2937' }}>
            <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 700, mb: 1 }}>
              Automated Alert Email Dispatch Rules
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
              Configure automatic email triggers when CRITICAL or WARNING threshold alerts fire on server nodes.
            </Typography>

            <List disablePadding sx={{ maxWidth: 600 }}>
              <ListItem sx={{ borderBottom: '1px solid #1F2937', py: 1.5 }}>
                <ListItemIcon sx={{ color: '#EF4444' }}>
                  <NotificationsActiveIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Critical Alert Auto-Dispatch"
                  secondary="Sends instant email to ops-team@shms.enterprise.io on CRITICAL severity"
                  primaryTypographyProps={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ color: '#64748B', fontSize: '0.75rem' }}
                />
                <Chip label="Backend Required" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#64748B' }} />
              </ListItem>
            </List>
          </Box>
        )}

        {/* Tab 3: Weekly Reports Configuration */}
        {activeTab === 3 && (
          <Box sx={{ p: 2, bgcolor: '#0D131F', borderRadius: 2, border: '1px solid #1F2937' }}>
            <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 700, mb: 1 }}>
              Weekly Telemetry Summary Email Schedule
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
              Automated weekly infrastructure performance digest dispatched every Monday at 08:00 UTC.
            </Typography>
            <Chip label="Backend Integration Pending" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }} />
          </Box>
        )}

        {/* Tab 4: Monthly Reports Configuration */}
        {activeTab === 4 && (
          <Box sx={{ p: 2, bgcolor: '#0D131F', borderRadius: 2, border: '1px solid #1F2937' }}>
            <Typography variant="subtitle1" sx={{ color: '#F8FAFC', fontWeight: 700, mb: 1 }}>
              Monthly Executive SLA Audit Schedule
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
              Automated monthly uptime and SLA compliance audit with PDF attachment sent on the 1st of every month.
            </Typography>
            <Chip label="Backend Integration Pending" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }} />
          </Box>
        )}
      </Card>
    </Container>
  );
}
