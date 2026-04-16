import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import NotFound from './pages/NotFound';
import Matches from './pages/Matches';
import Schedule from './pages/Schedule';
import Test from './pages/Test';
import AdminTestRequests from './pages/AdminTestRequests';
import TestingPage from './pages/testing';
import Profile from './pages/profile';
import Chat from './pages/Chat';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'signup',
        element: <Signup />
      },
      {
        path: 'auth',
        element: <Auth />
      },
      {
        path: 'testing',
        element: <TestingPage />
      },
      {
        path: 'marketplace',
        element: <Marketplace />
      },
      {
        path: 'matches',
        element: <Matches />
      },
      {
        path: 'chat',
        element: <Chat />
      },
      {
        path: 'schedule',
        element: <Schedule />
      },
      {
        path: 'test',
        element: <Test />
      },
      {
        path: 'admin/test-requests',
        element: <AdminTestRequests />
      },
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);
