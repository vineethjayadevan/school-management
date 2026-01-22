# Project Migration Guide (Git & Fresh Install)

Follow this complete guide to set up your School Management System on a **brand new computer** that has nothing installed.

## Phase 1: On the OLD Computer (Prepare Code)
1. **Push to GitHub**:
   - Ensure your code is committed and pushed to a GitHub repository.
   - If not initialized:
     ```bash
     git init
     git add .
     git commit -m "Complete project backup"
     # Create a repo on GitHub.com and follow instructions to add remote origin
     git push -u origin main
     ```
2. **Backup Database**:
   - MongoDB data is **NOT** stored in Git. You must manually copy it.
   - Open a terminal and run:
     ```bash
     mongodump --db school_management --out c:\path\to\desktop\backup
     ```
   - Copy the `backup` folder to a USB drive or Cloud Storage (Google Drive/Dropbox).
   - **Important**: Also copy your `server/.env` file content safely (e.g., in a secure note or email to yourself), as it is not uploaded to GitHub.

---

## Phase 2: On the NEW Computer (Installation)
Since the system is fresh, install these tools in order:

### 1. Install Git
- Download: [Git for Windows](https://git-scm.com/download/win)
- Install: Run the installer. Default settings are fine (Next, Next, Next...).

### 2. Install Node.js
- Download: [Node.js LTS](https://nodejs.org/) (Select "LTS" version).
- Install: Run the installer. Default settings are fine.

### 3. Install MongoDB
- Download: [MongoDB Community Server](https://www.mongodb.com/try/download/community).
- Install:
  - Run the installer.
  - **CRITICAL**: On the configuration screen, ensure **"Install MongoDB as a Service"** is CHECKED.
  - **CRITICAL**: Check **"Install MongoDB Compass"** (this is the UI to view your database).

### 4. Install VS Code (Optional but Recommended)
- Download: [Visual Studio Code](https://code.visualstudio.com/).

---

## Troubleshooting
- **Git Error: "Repository not found"**: 
  - This usually means you haven't created the repository on GitHub website yet.
  - Go to https://github.com/new
  - Create a repo named `school-management`.
  - Try the push command again.
- **Connection Error**: Ensure MongoDB service is running (`Verify in Task Manager > Services > MongoDB`).
- **Missing Modules**: If you see "Module not found", run `npm install` again in the respective folder.

---

## Phase 3: Get the Code
1. Open a terminal (Command Prompt or PowerShell).
2. Navigate to where you want the project (e.g., Desktop or Documents):
   ```bash
   cd Desktop
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/vineethjayadevan/school-management.git
   ```
4. Enter the folder:
   ```bash
   cd school-management
   ```
5. **Switch to Work Branch** (Important):
   ```bash
   git checkout work
   ```

---

## Phase 4: Setup & Configuration
1. **Install Dependencies**:
   ```bash
   # Install Frontend dependencies
   npm install

   # Install Backend dependencies
   cd server
   npm install
   ```

2. **Recreate Environment Variables**:
   - In the `server` folder, create a new file named `.env`.
   - Paste your saved configuration:
     ```env
     NODE_ENV=development
     PORT=5000
     MONGO_URI=mongodb://127.0.0.1:27017/school_management
     JWT_SECRET=supersecretkey_change_this_later
     ```

---

## Phase 5: Restore Database
1. Connect your USB drive (or download) the `backup` folder you created in Phase 1.
2. Open a terminal where the `backup` folder is located.
3. Run:
   ```bash
   mongorestore --db school_management path/to/backup/school_management
   ```
   *(Note: `mongorestore` comes with MongoDB Tools. If command not found, you may need to add it to PATH or run it from the MongoDB bin folder).*

---

## Phase 6: Launch
1. **Start Backend** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```
2. **Start Frontend** (Terminal 2):
   ```bash
   # In main folder
   npm run dev
   ```

Your application should now be running exactly as it was!
