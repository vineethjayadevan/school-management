# Technical Specification - School Management System

## 1. Technology Stack

The system is built using the **MERN Stack** (MongoDB, Express.js, React, Node.js), ensuring a robust, scalable, and full-stack JavaScript environment.

### 1.1 Frontend
- **Framework**: React.js (Vite)
- **Routing**: react-router-dom
- **State Management**: Zustand (for global store) & React Context API (Auth).
- **Styling**: Tailwind CSS with `lucide-react` for icons.
- **Form Handling**: react-hook-form with `zod` for validation.
- **HTTP Client**: Axios.
- **PDF Generation**: jspdf, jspdf-autotable.

### 1.2 Backend
- **Runtime**: Node.js.
- **Framework**: Express.js.
- **Database ODM**: Mongoose.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **File Uploads**: Multer (Local storage / Cloudinary ready).
- **Environment Management**: dotenv.

### 1.3 Database
- **Database**: MongoDB (NoSQL).
- **Hosting**: MongoDB Atlas (Cloud) or Local instance.

---

## 2. Database Schema

The database is designed with distinct collections for users, students, academic data, and financial records. Below are the key schemas:

### 2.1 User & Auth (`User.js`)
Stores system users with role-based access.
- **Fields**:
    - `name` (String): Full name.
    - `email` (String): Unique login email.
    - `password` (String): Hashed password (bcrypt).
    - `role` (Enum): 'superuser', 'admin', 'office_staff', 'teacher', 'student', 'board_member'.
    - `profileId` (ObjectId): Reference to `Student` or `Staff` profile.
    - `avatar`: URL to user avatar.

### 2.2 Student Management (`Student.js`)
Comprehensive student records.
- **Identity**: `admissionNo` (Unique), `rollNo`, `className`, `section`.
- **Personal**: `name`, `dob`, `gender`, `bloodGroup`, `religion`, `caste`, `nationality`.
- **Family**: `fatherName`, `motherName`, `guardian`, `emergencyContact`.
- **Contact**: `primaryPhone`, `email`, `residentialAddress`, `permanentAddress`.
- **Academic**: `previousSchool`, `previousClass`, `mediumOfInstruction`.
- **Health**: `hasLearningDisability`, `hasMedicalCondition`, `hasAllergy`.
- **Documents**: Array of uploaded document URLs (Birth Cert, TC).
- **Status**: `isActive` (Boolean), `feesStatus` (Paid/Pending).

### 2.3 Financial Modules

#### Fee Records (`Fee.js`)
Individual fee transaction records.
- **Fields**:
    - `student`: Reference to Student.
    - `feeType`: "Tuition Fee", "Admission Fee", etc.
    - `amount`: Transaction amount.
    - `academicYear`: e.g., "2025-2026".
    - `status`: 'Paid', 'Pending', 'Overdue'.
    - `paymentMode`: 'Cash', 'UPI', 'Cheque'.
    - `receiptNo`: Unique receipt identifier.

#### Expenses (`Expense.js`)
Operational expenditure tracking.
- **Fields**:
    - `title`: Short description.
    - `category`: e.g., "Infrastructure", "Salary".
    - `subcategory`: e.g., "Repairs", "Teaching Staff".
    - `amount`: Cost incurred.
    - `vendor`: Payee name.
    - `date`: Transaction date.
    - `referenceType`: 'Voucher' or 'Receipt'.
    - `addedBy`: Reference to User.

### 2.4 Staff Management (`Staff.js`)
- **Fields**:
    - `employeeId`: Unique ID (e.g., EMP001).
    - `name`, `email`, `phone`: Contact details.
    - `role`, `category`: 'Teacher', 'Non-Teaching', 'Driver'.
    - `qualification`: Education details.
    - `subjects`: Array of subjects handled.
    - `fixedSalary`, `paymentMode`: Compensation details.

### 2.5 Academic Modules

#### Timetable (`Timetable.js`)
- **Fields**:
    - `className`, `section`: Class context.
    - `dayOfWeek`: 'Monday', 'Tuesday', etc.
    - `periods`: Array of objects:
        - `periodNumber`: 1, 2, 3...
        - `subject`: Subject name.
        - `teacher`: Reference to Staff.
        - `startTime`, `endTime`.

#### Assignments (`Assignment.js`)
- **Fields**:
    - `title`, `description`.
    - `className`, `section`, `subject`.
    - `teacher`: Creator reference.
    - `dueDate`: Submission deadline.
    - `submissions`: Array of student submissions.

### 2.6 Financial Settlements (`Settlement.js`)
Tracks daily cash handovers from admins/staff to the board.
- **Fields**:
    - `amount`: Total cash handed over.
    - `date`: Settlement date.
    - `receivedBy`: Reference to Admin/Board Member.
    - `recordedBy`: Reference to Staff who handed over.
    - `notes`: Optional remarks.
    - `denominations`: Cash breakdown (₹500 x 10, etc.).

## 3. API Architecture

The application uses a **RESTful API** design served by Express.js. All API routes are prefixed with `/api`.

### 3.1 Base Configuration
- **Base URL**: `/api`
- **Authentication**: Bearer Token (JWT) required for all protected routes.
- **Error Handling**: Centralized error middleware returning JSON `{ message: "error description" }`.

### 3.2 Key Endpoints

#### Authentication (`/api/users`)
- `POST /login`: Authenticate user and return JWT.
- `GET /profile`: Get current user details.

#### Student Management (`/api/students`)
- `GET /`: List all students (with filters).
- `POST /`: Register a new student.
- `GET /:id`: Get detailed profile.
- `PUT /:id`: Update student details.
- `DELETE /:id`: Remove student record.

#### Finance (`/api/finance`)
- `GET /summary`: Dashboard financial metrics.
- `GET /expenses`: List operational expenses.
- `POST /expenses`: Record new expense.
- `GET /transactions`: Combined ledger of income and expenses.
- `GET /shareholders`: Board member equity and net worth data.

#### Academics (`/api/academics`)
- `GET /classes`: List all classes.
- `POST /classes`: Create new class.
- `GET /subjects`: List all subjects.
- `POST /subjects`: Add new subject.

#### Staff (`/api/staff`)
- `GET /`: List all staff members.
- `POST /`: Add new staff.

## 4. Frontend Architecture

### 4.1 Directory Structure
- `src/components`: Reusable UI components (Buttons, Inputs, Cards).
- `src/pages`: Page components organized by module (e.g., `pages/students`, `pages/finance`).
- `src/context`: React Context for global state (AuthContext).
- `src/services`: API service layers (Axios instances).
- `src/layouts`: Layout wrappers (DashboardLayout, StudentLayout).

### 4.2 State Management
- **Global Auth State**: Managed via `AuthContext` (User profile, Loading state).
- **Server State**: Managed via `useEffect` and local component state (useState) for data fetching.
- **Form State**: `react-hook-form` used for complex forms (Admission, Fee Collection).

### 4.3 Routing & Auth (`App.jsx`)
- **Router**: `react-router-dom` handles client-side routing.
- **Route Guards**: `RequireAuth` wrapper component checks:
    1.  Is user logged in? (Redirect to Login if not).
    2.  Does user have required role? (Redirect to Dashboard if unauthorized).
- **Role-Based Layouts**: specialized layouts for different user roles (Admin vs Teacher vs Student).
