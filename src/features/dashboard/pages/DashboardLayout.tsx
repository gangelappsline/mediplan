import { Outlet } from 'react-router-dom';

import { ClinicShell } from '@/features/dashboard/components/ClinicShell';

function DashboardLayout() {
  return (
    <ClinicShell>
      <Outlet />
    </ClinicShell>
  );
}

export { DashboardLayout };
