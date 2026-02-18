# Functional Specification - School Management System

## 1. System Overview
The School Management System is a comprehensive web-based application designed to streamline the administrative, academic, and financial operations of an educational institution. It serves multiple stakeholders including administrators, office staff, teachers, students, and board members, providing tailored internal dashboards and tools for each role.

## 2. User Roles and Permissions

The system defines the following user roles, each with specific access privileges:

| Role | Description | Key Access Areas |
| :--- | :--- | :--- |
| **Superuser** | Full system access. | User Management, All Admin Modules, Settings. |
| **Admin** | Senior school administrator. | Admissions, Students, Staff (HR), Academics, Fees, Events. |
| **Office Staff** | Administrative support. | Enquiries, Admissions (limited). |
| **Teacher** | Academic staff. | Class Management, Assignments, Schedule. |
| **Student** | Enrolled student. | Personal Dashboard, Schedule, Assignments, Fee Status. |
| **Board Member** | Financial oversight (Investory/Trustee). | Financial Dashboards, Ledgers, P&L, Balance Sheet, Reports. |

## 3. Functional Modules

### 3.1 Administration Module
*Target Users: Superuser, Admin*

The Administration Module is the central hub for school management, providing high-level oversight and control over system users and school-wide events.

#### 3.1.1 Dashboard
The Admin Dashboard provides a real-time snapshot of the school's performance.
- **Key Metrics**:
    - **Total Students**: Current active enrollment count.
    - **Total Revenue**: Aggregated revenue from fees (Cashflow).
    - **Total Staff**: Count of active teaching and non-teaching staff.
- **Quick Actions**: Navigation shortcuts to create admissions, view fees, etc.
- **Recent Activity**:
    - **Recent Admissions**: List of newly enrolled students with Class and Admission Number.
    - **Recent Fee Collections**: Stream of latest fee payments received.

#### 3.1.2 User Management *(Under Development)*
*Access: Superuser Only*
Allows the creation and management of system access for staff members.
- **Create User**: Add new users with specific roles:
    - **Admin**: Full access to academic and administrative functions.
    - **Office Staff**: Restricted access to enquiries and admissions.
    - **Teacher**: Access to academic tools (classes, assignments).
- **User List**: View all system users, their email addresses, and assigned roles.
- **Security**: Password management and role-based access control (RBAC) enforcement.

#### 3.1.3 Event Management *(Under Development)*
*Access: Superuser, Admin*
Tools to schedule and announce school events.
- **Create Event**: Schedule events with:
    - Title and Date.
    - Short Description (for card view) and Full Details (for popup).
    - Color Theme (Visual distinction for different event types).
- **Event List**: Card-based view of upcoming events.
- **Edit/Delete**: Modify event details or remove cancelled events.

### 3.2 Student Management & Admissions
*Target Users: Superuser, Admin, Office Staff*

This module manages the entire lifecycle of a student from initial enquiry to active enrollment.

#### 3.2.1 Enquiry Management
*Access: Admin, Office Staff*
Tracks potential student leads before admission.
- **Record Enquiry**: Capture student name, grade, parent contacts, and specific queries.
- **Status Tracking**: Move enquiries through stages:
    - **New**: Fresh web or walk-in enquiry.
    - **Contacted**: Staff has reached out.
    - **Admitted**: Student has taken admission (Links to Admission Form).
    - **Rejected/Closed**: Enquiry dropped.
- **Actionable Insights**: Color-coded status badges and quick action buttons (Call, Email).

#### 3.2.2 Admissions Process
*Access: Admin, Superuser*
A multi-step digital form to register new students.
- **Step 1: Student Information**: Personal details (Name, DOB, Gender, Religion), Admission Class, and Section.
- **Step 2: Parent & Guardian**: Father/Mother details, Occupations, and Emergency Contacts.
- **Step 3: Documents & Siblings**: Link sibling accounts for fee discounts and upload mandatory documents (Birth Certificate, Transfer Certificate).
- **Auto-Fill**: Pulls data from Enquiry record if converted.
- **ID Generation**: auto-generates unique Student ID and Admission Number.

#### 3.2.3 Student Directory
*Access: Admin, Superuser*
A searchable database of all enrolled students.
- **Filtering**: Filter students by:
    - **Class/Grade**: (Mont 1 to Grade 5).
    - **Fee Status**: Paid, Pending, Overdue.
    - **Gender**.
- **Student Profile**: Detailed view of a single student containing:
    - **Academic Info**: Class, Section, Roll No.
    - **Fee History**: Ledger of all payments and due dates.
    - **Attendance**: (Planned) Daily attendance record.
- **Export**: Download student lists as CSV for external reporting.


### 3.3 Finance & Accounting
*Target Users: Superuser, Admin, Board Members*

Comprehensive financial management system bridging daily operations with high-level accounting.

#### 3.3.1 Fee Management
*Access: Admin, Office Staff*
Streamlined interface for collecting student fees.
- **Collection Interface**: Quick lookup of students to collect Tuition, Materials, or Transport fees.
- **Flexible Payments**: Support for partial payments, custom amounts, and multiple modes (Cash, UPI, Cheque).
- **Conveyance Logic**: Auto-calculation of transport fees based on distance slabs.
- **Receipts**: Instant PDF receipt generation and thermal printer support.
- **Reports**: Daily collection reports and class-wise outstanding fee lists.

#### 3.3.2 Salary Management
*Access: Admin, Superuser*
- **Payroll Processing**: Monthly generation of staff salary lists based on active staff records.
- **Workflow**: Mark salaries as 'Paid' to automatically update the expense ledger.
- **Reports**: Download monthly salary disbursement reports (PDF).

#### 3.3.3 Board & Accounting
*Access: Board Members, Superuser*
High-level financial insights and reporting tailored for stakeholders.

- **Dashboard & Equity Tracking**:
    - **Live Net Worth**: Real-time calculation of the school's total value (Assets - Liabilities).
    - **Shareholder Value**: Tracks individual capital investments and calculating per-partner equity share.
    - **Capital Management**: Record capital introduced or withdrawn by partners.

- **Financial Recording**:
    - **Expense Ledger**: Detailed tracking of operational expenses with multi-level categorization (Category > Subcategory).
    - **Income Tracking**: Automated posting of collected fees and manual entry for 'Other Income' (Rentals, Grants).
    - **Double-Entry Operations**: Backend handles credits/debits automatically while users interact with simple forms.

- **Advanced Reporting**:
    - **Cashflow Statement**: Chronological ledger of all cash inflows and outflows.
    - **Profit & Loss (P&L)**:
        - **Cash Basis**: Reports surplus/deficit based strictly on actual money received and paid.
        - **Accrual Basis**: Adjusts for Accounts Receivable (Unpaid Fees) and Payable (Unpaid Salaries) to show true operational performance.
    - **Balance Sheet**:
        - **Assets**: Current Assets (Cash, Bank) + Fixed Assets (Infrastructure, Furniture).
        - **Liabilities**: Loans, Security Deposits.
        - **Equity**: Opening Balance + Capital + Accumulated Surplus.
    - **Valuation Tools**: Scenario-based projection calculator to estimate future net worth based on projected revenue/expense.

### 3.4 Academic Management *(Under Development)*
*Target Users: Admin, Teachers*

Core academic setup and scheduling features.

#### 3.4.1 Academic Setup
*Access: Admin*
- **Class Management**: Create and manage classes (e.g., Grade 1, Grade 2) and their sections (A, B, C).
- **Subject Management**: Define subjects and assign them to specific classes.
- **Teacher Allocation**: Assign class teachers and subject teachers.

#### 3.4.2 Timetable
*Access: Admin, Teacher, Student*
- **Schedule Creation**: Digital timetable creation mapping Days -> Periods -> Subjects -> Teachers.
- **Teacher View**: Personalized weekly schedule for teachers.
- **Student View**: Class-specific weekly timetable for students.

#### 3.4.3 Assignments
*Access: Teacher, Student*
- **Create Assignment**: Teachers can post homework with deadlines and descriptions.
- **Student Dashboard**: Students view pending and completed assignments.

### 3.5 Human Resources (HR) *(Under Development)*
*Target Users: Superuser, Admin*

- **Staff Directory**: Centralized database of all employees.
    - **Profiles**: Store qualifications, contact info, joining date, and subjects handled.
    - **Roles**: Manage teaching and non-teaching staff roles.
- **Payroll**: (See Finance > Salary Management).
- **Attendance**: (Planned) Staff attendance tracking.

### 3.6 Web Portals *(Under Development)*
- **Teacher Portal**: Dashboard for teachers to manage their schedule and assignments.
- **Student Portal**: Dashboard for students to view their progress and fees.
