const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  'http://localhost:3067/api';

export { API_BASE };

const TOKEN_KEY = 'spaceport_token';
const USER_KEY  = 'spaceport_user';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
export function logout() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

// Role helpers (admin > ops > viewer)
export function getRole() {
  return (getStoredUser()?.role || 'viewer').toLowerCase();
}
export function canWrite() {
  return ['admin', 'ops'].includes(getRole());
}
export function isAdmin() {
  return getRole() === 'admin';
}
// Back-compat alias used by template components
export const isCommander = isAdmin;

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }

  if (res.status === 401) {
    if (!url.startsWith('/auth/login')) {
      logout();
      throw new Error('Session expired');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Generic CRUD factory
function crud(base) {
  return {
    list:   ()       => request(`/${base}`),
    get:    (id)     => request(`/${base}/${id}`),
    create: (data)   => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d)  => request(`/${base}/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    remove: (id)     => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

// 18 spaceport CRUD APIs
export const launchVehiclesApi      = crud('launch-vehicles');
export const payloadsApi            = crud('payloads');
export const customersApi           = crud('customers');
export const missionsApi            = crud('missions');
export const launchWindowsApi       = crud('launch-windows');
export const rangeAssignmentsApi    = crud('range-assignments');
export const rangeSafetyZonesApi    = crud('range-safety-zones');
export const weatherBriefsApi       = crud('weather-briefs');
export const recoveryAssetsApi      = crud('recovery-assets');
export const fuelInventoryApi       = crud('fuel-inventory');
export const groundSystemsApi       = crud('ground-systems');
export const telemetryApi           = crud('telemetry');
export const anomaliesApi           = crud('anomalies');
export const debrisConjunctionsApi  = crud('debris-conjunctions');
export const commsLinksApi          = crud('comms-links');
export const regulatoryApprovalsApi = crud('regulatory-approvals');
export const postFlightReportsApi   = crud('post-flight-reports');
export const auditLogApi            = crud('audit-log');

// Dashboard
export const getDashboardStats = () => request('/dashboard');

// Custom views (Mission Views page)
export const getLaunchTimeline    = () => request('/custom-views/launch-timeline');
export const getConjunctionRisk   = () => request('/custom-views/conjunction-risk');
export const getRangeSafetyZones  = () => request('/custom-views/range-safety-zones');
export const getNextLaunch        = () => request('/custom-views/next-launch');

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

// AI endpoints — 16 spaceport verbs
const ai = (verb) => (body) =>
  request(`/ai/${verb}`, { method: 'POST', body: JSON.stringify(body || {}) });

export const aiLaunchWindowOptimize     = ai('launch-window-optimize');
export const aiWeatherWindowBrief       = ai('weather-window-brief');
export const aiConjunctionRisk          = ai('conjunction-risk');
export const aiRangeSafetyAssess        = ai('range-safety-assess');
export const aiFuelLoadoutCalc          = ai('fuel-loadout-calc');
export const aiRecoveryPlan             = ai('recovery-plan');
export const aiAnomalyTriage            = ai('anomaly-triage');
export const aiMissionBrief             = ai('mission-brief');
export const aiExecutiveBrief           = ai('executive-brief');
export const aiPayloadTrajectoryCheck   = ai('payload-trajectory-check');
export const aiGroundSystemsChecklist   = ai('ground-systems-checklist');
export const aiNgsLinkBudget            = ai('ngs-link-budget');
export const aiDraftPressRelease        = ai('draft-press-release');
export const aiDebrisMitigationPlan     = ai('debris-mitigation-plan');
export const aiPostFlightNarrative      = ai('post-flight-narrative');
export const aiRegulatoryComplianceCheck = ai('regulatory-compliance-check');

// AI history
export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({
    ...(feature ? { feature } : {}),
    limit: String(limit),
  }).toString();
  return request(`/ai/history?${qs}`);
};

// AI sample fills
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

// Notifications
export const getNotifications         = () => request('/notifications');
export const getUnreadNotifications   = () => request('/notifications/unread');
export const markNotificationRead     = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

// Webhooks
export const webhooksApi = {
  list:    ()         => request('/webhooks'),
  create:  (d)        => request('/webhooks',          { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)    => request(`/webhooks/${id}`,    { method: 'PUT',  body: JSON.stringify(d) }),
  remove:  (id)       => request(`/webhooks/${id}`,    { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ event, payload }),
  }),
  deliveries: (id)    => request(`/webhooks/${id}/deliveries`),
};
