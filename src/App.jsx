import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import AdmissionForm from './pages/students/AdmissionForm';
import FeeCollection from './pages/fees/FeeCollection';
import StaffDirectory from './pages/staff/StaffDirectory';
import EnquiryList from './pages/office/EnquiryList';
import ManageEvents from './pages/admin/ManageEvents';
import Academics from './pages/academics/Academics';
import Login from './pages/auth/Login';
import Home from './pages/Home';
import { Toaster } from './components/ui/Toast';
import { authService } from './services/auth';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';

// Guard Component
function RequireAuth({ children, allowedRoles }) {
    const location = useLocation();
    const user = authService.getCurrentUser();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if they try to access unauthorized area
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
        if (['superuser', 'admin', 'office_staff'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Toaster />
            <Routes>
                {/* PUBLIC ROUTE */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />

                {/* Shared Login Redirect Helper */}
                <Route path="/redirect" element={<RedirectHandler />} />

                {/* OFFICE / ADMIN ROUTES */}
                <Route path="/admin" element={
                    <RequireAuth allowedRoles={['superuser', 'admin', 'office_staff']}>
                        <DashboardLayout />
                    </RequireAuth>
                }>
                    <Route index element={<RedirectHandler />} />

                    <Route path="dashboard" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <Dashboard />
                        </RequireAuth>
                    } />

                    <Route path="enquiries" element={
                        <RequireAuth allowedRoles={['superuser', 'office_staff']}>
                            <EnquiryList />
                        </RequireAuth>
                    } />

                    {/* General Office Access (Admin + Superuser only now) */}
                    <Route path="students" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <StudentList />
                        </RequireAuth>
                    } />
                    <Route path="students/admit" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <AdmissionForm />
                        </RequireAuth>
                    } />
                    <Route path="academics" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <Academics />
                        </RequireAuth>
                    } />

                    {/* Restricted to Superuser & Admin */}
                    <Route path="fees" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <FeeCollection />
                        </RequireAuth>
                    } />
                    <Route path="staff" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <StaffDirectory />
                        </RequireAuth>
                    } />
                    <Route path="events" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <ManageEvents />
                        </RequireAuth>
                    } />
                </Route>

                {/* TEACHER ROUTES */}
                <Route path="/teacher" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <TeacherLayout />
                    </RequireAuth>
                }>
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="classes" element={<div>My Classes Placeholder</div>} />
                    <Route path="assignments" element={<div>Assignments Placeholder</div>} />
                    <Route path="schedule" element={<div>Schedule Placeholder</div>} />
                </Route>

                {/* STUDENT ROUTES */}
                <Route path="/student" element={
                    <RequireAuth allowedRoles={['student']}>
                        <StudentLayout />
                    </RequireAuth>
                }>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="schedule" element={<div>My Schedule Placeholder</div>} />
                    <Route path="assignments" element={<div>My Assignments Placeholder</div>} />
                    <Route path="fees" element={<StudentFees />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

function RedirectHandler() {
    const user = authService.getCurrentUser();
    if (!user) return <Navigate to="/login" replace />;

    if (['superuser', 'admin'].includes(user.role)) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'office_staff') {
        return <Navigate to="/admin/enquiries" replace />;
    }
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;

    return <Navigate to="/login" replace />;
}

export default App
