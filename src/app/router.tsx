import { createBrowserRouter, Navigate } from 'react-router'

import { RequireAuth } from '@/app/AppLayout'
import { RouteError } from '@/app/RouteError'
import { LoginPage } from '@/features/auth/LoginPage'
import { BranchesPreviewPage, DashboardPreviewPage, ManagersPreviewPage } from '@/features/preview/PreviewPages'
import { ProfilePage } from '@/features/profile/ProfilePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPreviewPage /> },
      { path: 'sucursales', element: <BranchesPreviewPage /> },
      { path: 'gerentes', element: <ManagersPreviewPage /> },
      { path: 'perfil', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
