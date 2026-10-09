import { createBrowserRouter, Navigate } from 'react-router'

import { RequireAuth } from '@/app/AppLayout'
import { PageFallback } from '@/app/PageFallback'
import { RouteError } from '@/app/RouteError'
import { LoginPage } from '@/features/auth/LoginPage'

// Each section is its own chunk (the dashboard brings Recharts), so the first load stays small.

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageFallback />,
    children: [
      {
        index: true,
        lazy: () => import('@/features/dashboard/DashboardPage').then((module) => ({ Component: module.DashboardPage })),
      },
      {
        path: 'sucursales',
        lazy: () => import('@/features/branches/BranchListPage').then((module) => ({ Component: module.BranchListPage })),
      },
      {
        path: 'sucursales/:branchId',
        lazy: () =>
          import('@/features/branches/StationDetailPage').then((module) => ({ Component: module.StationDetailPage })),
      },
      {
        path: 'sucursales/:branchId/cortes/:cutId',
        lazy: () => import('@/features/branches/CutReportPage').then((module) => ({ Component: module.CutReportPage })),
      },
      {
        path: 'gerentes',
        lazy: () => import('@/features/managers/ManagerListPage').then((module) => ({ Component: module.ManagerListPage })),
      },
      {
        path: 'perfil',
        lazy: () => import('@/features/profile/ProfilePage').then((module) => ({ Component: module.ProfilePage })),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
