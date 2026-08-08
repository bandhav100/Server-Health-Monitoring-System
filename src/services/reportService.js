// Report Service Boundary
// Will connect to real report backend endpoints (e.g. POST /api/reports/generate, GET /api/reports/history) when implemented by backend.

export const generateReport = async (reportConfig) => {
  throw new Error('Report generation API is not documented in current backend specs.');
};

export const fetchReportHistory = async () => {
  throw new Error('Report history API is not documented in current backend specs.');
};
