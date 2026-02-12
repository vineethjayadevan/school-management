import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import BoardLayout from './layouts/BoardLayout';
import BoardDashboard from './pages/board/BoardDashboard';
import ExpenseManager from './pages/board/ExpenseManager';

import IncomeOverview from './pages/board/IncomeOverview';
import Cashflow from './pages/board/Cashflow';
import AccountingDashboard from './pages/board/accounting/AccountingDashboard';
import ProfitAndLoss from './pages/board/accounting/ProfitAndLoss';
import BalanceSheet from './pages/board/accounting/BalanceSheet';
import AssetRegister from './pages/board/accounting/AssetRegister';

import Adjustments from './pages/board/accounting/Adjustments';
import CashBasedAccounting from './pages/board/CashBasedAccounting';
import AccrualBasedAccounting from './pages/board/AccrualBasedAccounting';

import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetails from './pages/students/StudentDetails';
import AdmissionForm from './pages/students/AdmissionForm';
import FeeCollection from './pages/fees/FeeCollection';
import StaffDirectory from './pages/staff/StaffDirectory';
import EnquiryList from './pages/office/EnquiryList';
import ManageEvents from './pages/admin/ManageEvents';
import Academics from './pages/academics/Academics';
import Login from './pages/auth/Login';
import Home from './pages/Home';
import UserManagement from './pages/admin/UserManagement';
import Admissions from './pages/admin/Admissions';
import SalaryManager from './pages/admin/SalaryManager';
import { Toaster } from './components/ui/Toast';
import { authService } from './services/auth';
import { useAuth } from './context/AuthContext';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';

// Guard Component
// Guard Component
function RequireAuth({ children, allowedRoles }) {
    const location = useLocation();
    const { user, loading } = useAuth(); // Use context instead of direct service call

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if they try to access unauthorized area
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
        if (user.role === 'board_member') return <Navigate to="/board/dashboard" replace />;
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

                    <Route path="users" element={
                        <RequireAuth allowedRoles={['superuser']}>
                            <UserManagement />
                        </RequireAuth>
                    } />

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
                    <Route path="students/:id" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <StudentDetails />
                        </RequireAuth>
                    } />
                    <Route path="admissions/new" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <AdmissionForm />
                        </RequireAuth>
                    } />
                    <Route path="admissions" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <Admissions />
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
                    <Route path="salaries" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <SalaryManager />
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

                {/* BOARD MEMBER ROUTES */}
                <Route path="/board" element={
                    <RequireAuth allowedRoles={['board_member']}>
                        <BoardLayout />
                    </RequireAuth>
                }>
                    <Route index element={<Navigate to="/board/cash-based" replace />} />
                    <Route path="dashboard" element={<Navigate to="/board/cash-based" replace />} />
                    <Route path="cash-based" element={<CashBasedAccounting />} />
                    <Route path="accrual-based" element={<AccrualBasedAccounting />} />

                    {/* Keep legacy routes accessible if needed, or redirect them? 
                        For now, let's keep them as valid sub-routes or just remove if we want to force the new view.
                        The new view uses components directly so we don't strictly need these routes unless directly accessed.
                     */}
                    <Route path="expenses" element={<ExpenseManager />} />
                    <Route path="income" element={<IncomeOverview />} />
                    <Route path="cashflow" element={<Cashflow />} />
                    <Route path="accounting" element={<AccountingDashboard />}>
                        <Route path="pnl" element={<ProfitAndLoss />} />
                        <Route path="balance-sheet" element={<BalanceSheet />} />
                        <Route path="assets" element={<AssetRegister />} />
                        <Route path="adjustments" element={<Adjustments />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

function RedirectHandler() {
    const { user, loading } = useAuth();

    if (loading) return null; // Or spinner

    if (!user) return <Navigate to="/login" replace />;

    if (['superuser', 'admin'].includes(user.role)) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'office_staff') {
        return <Navigate to="/admin/enquiries" replace />;
    }
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'board_member') return <Navigate to="/board/cash-based" replace />;

    return <Navigate to="/login" replace />;
}

export default App
