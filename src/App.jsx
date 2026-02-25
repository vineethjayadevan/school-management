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
import ManageCategories from './pages/board/ManageCategories';
import RevenueExpenseManager from './pages/board/accrual/RevenueExpenseManager';
import ReceivablesPayablesManager from './pages/board/accrual/ReceivablesPayablesManager';
import Settlements from './pages/board/accrual/Settlements';
import AccrualAccountingView from './pages/board/accounting/AccrualAccountingView';

import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetails from './pages/students/StudentDetails';
import AdmissionForm from './pages/students/AdmissionForm';
import FeeCollection from './pages/fees/FeeCollection';
import StaffDirectory from './pages/staff/StaffDirectory';
import StaffForm from './pages/staff/StaffForm';
import SalaryStructure from './pages/staff/SalaryStructure';
import EnquiryList from './pages/office/EnquiryList';
import ManageEvents from './pages/admin/ManageEvents';
import Academics from './pages/academics/Academics';
import AcademicYears from './pages/admin/AcademicYears';
import SystemSettings from './pages/admin/SystemSettings';
import PromotionWizard from './pages/admin/PromotionWizard';

import Login from './pages/auth/Login';
import Home from './pages/Home';
import UserManagement from './pages/admin/UserManagement';
import Admissions from './pages/admin/Admissions';
import SalaryManager from './pages/admin/SalaryManager';
import TransferCertificates from './pages/admin/TransferCertificates';
import { Toaster } from './components/ui/Toast';
import { authService } from './services/auth';
import { useAuth } from './context/AuthContext';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ClassDetails from './pages/teacher/ClassDetails';
import MyClasses from './pages/teacher/MyClasses';
import TeacherProfile from './pages/teacher/TeacherProfile';
import AttendanceMarking from './pages/teacher/AttendanceMarking';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';

import SystemLogin from './pages/system/SystemLogin';
import SuperAdminDashboard from './pages/system/SuperAdminDashboard';

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
        if (user.role === 'superadmin') return <Navigate to="/system/dashboard" replace />;
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
        if (user.role === 'board_member') return <Navigate to="/board/accrual-based" replace />;
        if (['superuser', 'admin', 'office_staff', 'officestaff'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
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

                {/* SYSTEM ADMIN ROUTES */}
                <Route path="/system/login" element={<SystemLogin />} />
                <Route path="/system/dashboard" element={
                    <RequireAuth allowedRoles={['superadmin']}>
                        <SuperAdminDashboard />
                    </RequireAuth>
                } />

                {/* Shared Login Redirect Helper */}
                <Route path="/redirect" element={<RedirectHandler />} />

                {/* OFFICE / ADMIN ROUTES */}
                <Route path="/admin" element={
                    <RequireAuth allowedRoles={['superuser', 'admin', 'office_staff', 'officestaff']}>
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
                        <RequireAuth allowedRoles={['superuser', 'office_staff', 'officestaff']}>
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
                    <Route path="system-settings" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <SystemSettings />
                        </RequireAuth>
                    } />
                    <Route path="promotion" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <PromotionWizard />
                        </RequireAuth>
                    } />
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
                    <Route path="staff/new" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <StaffForm />
                        </RequireAuth>
                    } />
                    <Route path="staff/edit/:id" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <StaffForm />
                        </RequireAuth>
                    } />
                    <Route path="salary-structure" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <SalaryStructure />
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
                    <Route path="academic-years" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <AcademicYears />
                        </RequireAuth>
                    } />
                    <Route path="transfer-certificates" element={
                        <RequireAuth allowedRoles={['superuser', 'admin']}>
                            <TransferCertificates />
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
                    <Route path="classes" element={<MyClasses />} />
                    <Route path="classes/:className/:sectionName" element={<ClassDetails />} />
                    <Route path="profile" element={<TeacherProfile />} />
                    <Route path="attendance" element={<AttendanceMarking />} />
                    <Route path="assignments" element={<div>Assignments Placeholder</div>} />
                    <Route path="schedule" element={<TeacherSchedule />} />
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
                    <Route index element={<Navigate to="/board/ledger" replace />} />

                    {/* New Sidebar Navigation Routes */}
                    <Route path="ledger" element={<BoardDashboard />} />
                    <Route path="revenue-expense" element={<RevenueExpenseManager />} />
                    <Route path="receivables-payables" element={<ReceivablesPayablesManager />} />
                    <Route path="settlements" element={<Settlements />} />
                    <Route path="accounting" element={<AccrualAccountingView />} />
                    <Route path="categories" element={<ManageCategories />} />

                    {/* Keep legacy nested routes if necessary for internal navigation, 
                        though mostly replaced by above. 
                        Adjustments and detailed views can still be accessed via /board/accounting/ ... 
                    */}
                    <Route path="accounting/pnl" element={<ProfitAndLoss />} />
                    <Route path="accounting/balance-sheet" element={<BalanceSheet />} />
                    <Route path="accounting/assets" element={<AssetRegister />} />
                    <Route path="accounting/adjustments" element={<Adjustments />} />
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

    if (user.role === 'superadmin') {
        return <Navigate to="/system/dashboard" replace />;
    }
    if (['superuser', 'admin'].includes(user.role)) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'office_staff' || user.role === 'officestaff') {
        return <Navigate to="/admin/enquiries" replace />;
    }
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'board_member') return <Navigate to="/board/ledger" replace />;

    return <Navigate to="/login" replace />;
}

export default App
