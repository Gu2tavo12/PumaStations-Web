import { createBrowserRouter } from 'react-router'

import { SetupPage } from '@/features/setup/SetupPage'

// Phase 1 replaces the setup page with login + the general manager layout.
export const router = createBrowserRouter([
  { path: '/', element: <SetupPage /> },
  { path: '*', element: <SetupPage /> },
])
