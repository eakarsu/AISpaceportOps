import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// 18 CRUD pages
import LaunchVehiclesPage      from './pages/LaunchVehiclesPage';
import PayloadsPage            from './pages/PayloadsPage';
import CustomersPage           from './pages/CustomersPage';
import MissionsPage            from './pages/MissionsPage';
import LaunchWindowsPage       from './pages/LaunchWindowsPage';
import RangeAssignmentsPage    from './pages/RangeAssignmentsPage';
import RangeSafetyZonesPage    from './pages/RangeSafetyZonesPage';
import WeatherBriefsPage       from './pages/WeatherBriefsPage';
import RecoveryAssetsPage      from './pages/RecoveryAssetsPage';
import FuelInventoryPage       from './pages/FuelInventoryPage';
import GroundSystemsPage       from './pages/GroundSystemsPage';
import TelemetryPage           from './pages/TelemetryPage';
import AnomaliesPage           from './pages/AnomaliesPage';
import DebrisConjunctionsPage  from './pages/DebrisConjunctionsPage';
import CommsLinksPage          from './pages/CommsLinksPage';
import RegulatoryApprovalsPage from './pages/RegulatoryApprovalsPage';
import PostFlightReportsPage   from './pages/PostFlightReportsPage';
import AuditLogPage            from './pages/AuditLogPage';

// 16 AI pages
import AILaunchWindowOptimizePage    from './pages/AILaunchWindowOptimizePage';
import AIWeatherWindowBriefPage      from './pages/AIWeatherWindowBriefPage';
import AIConjunctionRiskPage         from './pages/AIConjunctionRiskPage';
import AIRangeSafetyAssessPage       from './pages/AIRangeSafetyAssessPage';
import AIFuelLoadoutCalcPage         from './pages/AIFuelLoadoutCalcPage';
import AIRecoveryPlanPage            from './pages/AIRecoveryPlanPage';
import AIAnomalyTriagePage           from './pages/AIAnomalyTriagePage';
import AIMissionBriefPage            from './pages/AIMissionBriefPage';
import AIExecutiveBriefPage          from './pages/AIExecutiveBriefPage';
import AIPayloadTrajectoryCheckPage  from './pages/AIPayloadTrajectoryCheckPage';
import AIGroundSystemsChecklistPage  from './pages/AIGroundSystemsChecklistPage';
import AINgsLinkBudgetPage           from './pages/AINgsLinkBudgetPage';
import AIDraftPressReleasePage       from './pages/AIDraftPressReleasePage';
import AIDebrisMitigationPlanPage    from './pages/AIDebrisMitigationPlanPage';
import AIPostFlightNarrativePage     from './pages/AIPostFlightNarrativePage';
import AIRegulatoryComplianceCheckPage from './pages/AIRegulatoryComplianceCheckPage';

// Admin
import WebhooksPage from './pages/WebhooksPage';

// Custom Mission Views (Gantt + risk scatter)
import CustomViewsPage from './pages/CustomViewsPage';

import LoginPage from './pages/LoginPage';
import { getToken } from './services/api';

import './App.css';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ShellRoutes() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/launch-vehicles"      element={<LaunchVehiclesPage />} />
            <Route path="/payloads"             element={<PayloadsPage />} />
            <Route path="/customers"            element={<CustomersPage />} />
            <Route path="/missions"             element={<MissionsPage />} />
            <Route path="/launch-windows"       element={<LaunchWindowsPage />} />
            <Route path="/range-assignments"    element={<RangeAssignmentsPage />} />
            <Route path="/range-safety-zones"   element={<RangeSafetyZonesPage />} />
            <Route path="/weather-briefs"       element={<WeatherBriefsPage />} />
            <Route path="/recovery-assets"      element={<RecoveryAssetsPage />} />
            <Route path="/fuel-inventory"       element={<FuelInventoryPage />} />
            <Route path="/ground-systems"       element={<GroundSystemsPage />} />
            <Route path="/telemetry"            element={<TelemetryPage />} />
            <Route path="/anomalies"            element={<AnomaliesPage />} />
            <Route path="/debris-conjunctions"  element={<DebrisConjunctionsPage />} />
            <Route path="/comms-links"          element={<CommsLinksPage />} />
            <Route path="/regulatory-approvals" element={<RegulatoryApprovalsPage />} />
            <Route path="/post-flight-reports"  element={<PostFlightReportsPage />} />
            <Route path="/audit-log"            element={<AuditLogPage />} />

            <Route path="/ai/launch-window-optimize"     element={<AILaunchWindowOptimizePage />} />
            <Route path="/ai/weather-window-brief"       element={<AIWeatherWindowBriefPage />} />
            <Route path="/ai/conjunction-risk"           element={<AIConjunctionRiskPage />} />
            <Route path="/ai/range-safety-assess"        element={<AIRangeSafetyAssessPage />} />
            <Route path="/ai/fuel-loadout-calc"          element={<AIFuelLoadoutCalcPage />} />
            <Route path="/ai/recovery-plan"              element={<AIRecoveryPlanPage />} />
            <Route path="/ai/anomaly-triage"             element={<AIAnomalyTriagePage />} />
            <Route path="/ai/mission-brief"              element={<AIMissionBriefPage />} />
            <Route path="/ai/executive-brief"            element={<AIExecutiveBriefPage />} />
            <Route path="/ai/payload-trajectory-check"   element={<AIPayloadTrajectoryCheckPage />} />
            <Route path="/ai/ground-systems-checklist"   element={<AIGroundSystemsChecklistPage />} />
            <Route path="/ai/ngs-link-budget"            element={<AINgsLinkBudgetPage />} />
            <Route path="/ai/draft-press-release"        element={<AIDraftPressReleasePage />} />
            <Route path="/ai/debris-mitigation-plan"     element={<AIDebrisMitigationPlanPage />} />
            <Route path="/ai/post-flight-narrative"      element={<AIPostFlightNarrativePage />} />
            <Route path="/ai/regulatory-compliance-check" element={<AIRegulatoryComplianceCheckPage />} />

            <Route path="/webhooks" element={<WebhooksPage />} />

            <Route path="/custom-views" element={<CustomViewsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShellRoutes />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
