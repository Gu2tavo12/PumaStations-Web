import { createBrowserRouter, Navigate } from 'react-router'

import { RequireAuth } from '@/app/AppLayout'
import { RouteError } from '@/app/RouteError'
import { LoginPage } from '@/features/auth/LoginPage'
import { BranchListPage } from '@/features/branches/BranchListPage'
import { CutReportPage } from '@/features/branches/CutReportPage'
import { StationDetailPage } from '@/features/branches/StationDetailPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ManagersPreviewPage } from '@/features/preview/PreviewPages'
import { ProfilePage } from '@/features/profile/ProfilePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'sucursales', element: <BranchListPage /> },
      { path: 'sucursales/:branchId', element: <StationDetailPage /> },
      { path: 'sucursales/:branchId/cortes/:cutId', element: <CutReportPage /> },
      { path: 'gerentes', element: <ManagersPreviewPage /> },
      { path: 'perfil', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
