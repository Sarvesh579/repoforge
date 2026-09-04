# REPOFORGE HACKATHON PROJECT - PORTAL FUNCTIONALITIES

## Table of Contents
- [Admin Portal](#admin-portal)
- [Participant Portal](#participant-portal)
- [Shared Features](#shared-features)

---

## ADMIN PORTAL

### 1. Dashboard Section
- **Overview Cards**: Display key metrics:
  - Total Teams registered
  - Pending Reviews (teams submitted but not shortlisted)
  - Problem Statements available
  - Shortlisted teams for final round
- **Recent Teams Panel**: Shows latest team registrations with team name, member count, selected problem, and submission status
- **Registration Status Panel**: Display current registration status (open/closed) and registration deadline
- **Quick Actions**: Add Problem Statement button

### 2. Problem Statements Management
- **View All Problems**: Display all 5 problem statements (PS01-PS05) in card format
- **Search Functionality**: Filter problems by ID, title, domain, or tags
- **Add Problem Statement**: 
  - Form with fields: ID, title, description, domain, tags
  - Validation for required fields
- **Edit Problem Statement**: Modify existing problem details
- **Delete Problem Statement**: Remove problems with confirmation
- **View Details**: Modal popup showing complete problem information

### 3. Teams Management
- **List All Teams**: View all registered teams with information:
  - Team name and ID
  - Team leader name
  - Selected problem statement
  - Submission status (Submitted/Pending)
- **Search Teams**: Filter by team name, ID, leader name, or problem selected
- **Shortlist Teams**: Mark/unmark teams for shortlisting (can toggle on/off)
- **Visual Status Indicators**: Color-coded submission status

### 4. Submissions Review
- **View Submitted Presentations**: See all team submissions:
  - Team name and ID
  - Submitted file name
  - Submission date
  - File status
- **Download Presentations**: View or download submitted presentation files
- **Track Pending Submissions**: Identify teams that haven't submitted yet

### 5. Results & Winner Assignment
- **View Shortlisted Teams**: See which teams are shortlisted
- **Assign Winners**: Mark teams as:
  - 🥇 1st Place
  - 🥈 2nd Place
  - 🥉 3rd Place
- **Only one team per position**: Auto-deselect previous winner when assigning new one
- **Toggle Winner Status**: Can remove winner status by clicking again

### 6. Settings Management
- **Hackathon Configuration**:
  - Hackathon Name (editable)
  - Hackathon Year (number input)
  - Submission Deadline (date picker)
  - Hackathon Status (dropdown: Live/Paused/Closed)
  - Registration Status (dropdown: Open/Closed)
- **Save Settings**: Button to save all changes
- **Success Feedback**: Confirmation message when settings saved
- **Local Storage**: Settings persist in browser

### 7. Navigation & General Features
- **Sidebar Navigation**: Quick access to all sections with icons
  - 📊 Dashboard
  - 📋 Problem Statements
  - 👥 Teams
  - 📁 Submissions
  - 🏆 Results
  - ⚙️ Settings
- **Admin Header**: Shows "ADMINISTRATION" heading and current section
- **Admin Profile**: Displays admin avatar and ID (ADMIN001)
- **Logout**: Secure logout button in sidebar
- **Brand Section**: REPOFORGE logo and admin portal label

---

## PARTICIPANT PORTAL

### 1. Dashboard Section
- **Welcome Section**: Personalized welcome message with hackathon status (Live/Paused/Closed)
- **Status Cards**:
  - Your Problem: Currently selected problem statement with title
  - Shortlist Status: Shows if team is shortlisted
  - Submission Status: Submitted or Pending with appropriate icon
  - Submission Deadline: Days remaining, formatted deadline date
- **Announcements Panel**: Latest updates and important notices
- **Deadline Panel**: Next deadline (Final Presentation) with date visualization
- **Your Team Panel**: Quick view of team members with roles and avatars
- **Selected Problem Panel**: Preview of currently selected problem with "View Full Problem" option

### 2. Problem Statements Section
- **Explore Challenges**: View all 10 available problem statements (PS01-PS05)
- **Search Functionality**: Filter problems by:
  - Problem ID
  - Problem title
  - Domain
  - Tags
- **Problem Cards Display**:
  - Problem ID and LIVE badge
  - Title and description
  - Domain and relevant tags
  - View Details button
  - Select Problem button (leader only)
- **Empty State**: Message when no search results found
- **View Details Modal**: See full problem information with domain and technology tags

### 3. Problem Selection (Leader Only)
- **Select Problem**: Only Team Leader can select problem statement
- **Confirmation Dialog**: Double confirmation before selecting
- **Restriction**: Non-leaders see restriction warning ("⚠️ Access Restricted - Only the Team Leader can select a Problem Statement")
- **Storage**: Selected problem saved to localStorage
- **Success Notification**: Confirmation alert with problem details

### 4. My Team Section
- **Team Information**:
  - Team Name
  - Team ID
  - Team Status (Registered/Active badge)
- **Team Members List**:
  - Team member avatars with initials
  - Member names
  - Member roles (Team Leader, Developer, Designer, etc.)
  - Display of team composition (4 members in demo)
- **Team Activity**: Status indicator showing team is active

### 5. Final Presentation Submission
- **Submission Status Display**:
  - Icon and message (Submitted ✅ or Pending 📤)
  - Status description
  - Deadline warning (when not submitted)
- **Upload Area** (when not submitted):
  - Click-to-upload file input
  - Drag-and-drop interface
  - Accepted file types: .ppt, .pptx, .pdf
  - File size limit: 10 MB
  - Error handling for large files
- **Submit Button**: Final submission confirmation
- **Submission Confirmation**: Double confirmation before submitting
- **Success Notification**: Alert when presentation submitted successfully
- **Persistent State**: Submission status saved to localStorage

### 6. Navigation & Header
- **Navbar Components**:
  - Brand logo "IX" with "REPOFORGE" branding
  - Hackathon name and year display
  - Navigation tabs: Dashboard, Problem Statements, My Team, Submission
  - Tab highlighting for active section
- **User Profile Area**:
  - Notification bell button (shows notifications popup)
  - User avatar with participant role
  - Team name display
  - Logout button
- **Notifications**: 
  - Problem Statements released
  - Team shortlisted
  - Submission pending
  - Submission deadline information

### 7. Deadline Management
- **Deadline Tracking**:
  - Days remaining calculation
  - Formatted deadline display (e.g., "30 August 2026")
  - "Today", "Closed" messaging for edge cases
  - Real-time countdown (resets at midnight)
- **Deadline Warnings**: Visual indicators when approaching deadline
- **Settings Sync**: Gets deadline from admin-configured settings in real-time

### 8. Permissions & Role-Based Access
- **Team Leader Access**:
  - Can select problem statements
  - Full access to all sections
- **Team Member Access**:
  - View-only access to problem statements
  - Restricted from selecting problems
  - Can view team information and submission status

### 9. Real-Time Features
- **Settings Subscription**: Automatically updates when admin changes hackathon settings
- **Problem Statements**: Pulls from admin-defined statements
- **Persistent Data**: Uses localStorage for:
  - Selected problem
  - Submission status
  - File name

---

## SHARED FEATURES

### Authentication
- **Login Credentials**:
  - Admin: ID: ADMIN001, Password: admin123
  - Participant (Leader): ID: PHX024, Password: phoenix123
- **Role-Based Routing**: Users redirected based on role
- **Protected Routes**: Access control between admin and participant sections
- **Auth Context**: Manages user role, team ID, and authentication state
- **Logout Functionality**: Clears user session and redirects to login

### Data Persistence
- **localStorage**: Stores:
  - User role (admin/leader)
  - Team ID
  - Selected problem statement
  - Submission status
  - Presentation file name
- **hackathonStorage.js**: Manages hackathon settings
  - Settings subscription for real-time updates
  - Default settings configuration
- **problemStorage.js**: Manages problem statements
  - CRUD operations for problems
- **Demo Teams Data**: Pre-populated with 3 teams:
  - Team Phoenix (PHX024) - Leader: Member 1
  - Team Nova (NOVA018) - Leader: Member 1
  - Team Titans (TITAN031) - Leader: Member 1

### UI/UX Features
- **Responsive Design**: Works across devices
- **Modal Dialogs**: Confirmation alerts and detail views
- **Search Functionality**: Across both portals with real-time filtering
- **Status Indicators**: Color-coded badges and icons
- **Empty States**: Friendly messages when no data available
- **Loading States**: Appropriate feedback during data operations
- **Success/Error Notifications**: Alert messages for user actions
- **Accessibility**: Semantic HTML, proper button labels, keyboard navigation

### Project Structure
```
src/
├── pages/
│   ├── AdminDashboard.jsx      # Admin portal main component
│   ├── ParticipantDashboard.jsx # Participant portal main component
│   ├── Login.jsx               # Authentication page
│   └── Home.jsx                # Homepage
├── components/
│   ├── Navbar.jsx              # Navigation bar
│   ├── ProblemModal.jsx        # Problem details modal
│   └── ProtectedRoute.jsx      # Route protection component
├── context/
│   └── AuthContext.jsx         # Authentication context provider
├── data/
│   ├── hackathonStorage.js     # Hackathon settings management
│   ├── problemStorage.js       # Problem statements storage
│   └── problemStatements.js    # Problem statements data
└── styles/
    ├── admin.css               # Admin portal styles
    ├── participant.css         # Participant portal styles
    ├── login.css               # Login page styles
    ├── home.css                # Home page styles
    └── App.css                 # Global styles
```

---

## KEY WORKFLOWS

### Admin Workflow
1. Admin logs in with credentials (ADMIN001 / admin123)
2. Views dashboard with key metrics
3. Manages problem statements (add, edit, delete, view)
4. Reviews team registrations and submissions
5. Shortlists teams for final round
6. Reviews submitted presentations
7. Assigns winners (1st, 2nd, 3rd place)
8. Configures hackathon settings and deadlines
9. Logs out securely

### Participant Workflow
1. Team leader logs in with credentials (PHX024 / phoenix123)
2. Views personalized dashboard with hackathon status
3. Explores and views problem statements
4. Team leader selects a problem statement
5. Views team members and information
6. Uploads and submits final presentation before deadline
7. Receives feedback on shortlist status
8. Logs out securely

### Data Flow
- Admin configures settings → Settings stored in localStorage & hackathonStorage
- Settings subscription in Participant portal → Real-time updates
- Admin creates/edits problems → problemStorage updated
- Participant views problems → Fetched from problemStorage
- Participant selects problem → Saved to localStorage
- Participant submits presentation → Saved to localStorage

---

## TECHNICAL FEATURES

### State Management
- React hooks (useState, useContext, useEffect)
- useAuth() custom hook for authentication
- Context API for global auth state
- localStorage for persistent data
- useMemo for performance optimization

### Search & Filtering
- Real-time search in problem statements
- Team search by name, ID, leader, or problem
- Filter problems by domain, tags, ID, or title
- Memoized filtering for performance

### Deadline Features
- Dynamic deadline calculations
- Date formatting (en-GB format)
- Days remaining countdown
- Edge case handling (Today, Closed)

### File Handling
- File upload with size validation (max 10 MB)
- Multiple file type support (.ppt, .pptx, .pdf)
- File name tracking
- Error notifications for invalid files

### Notifications
- Alert-based notifications
- Confirmation dialogs for critical actions
- Success/error messages
- Real-time deadline reminders

---

## SECURITY FEATURES

- Protected routes based on user role
- Password-protected login
- Session management via localStorage
- Role-based access control (RBAC)
- Confirmation dialogs for destructive actions
- Input validation for forms

---

## FUTURE ENHANCEMENTS

- Backend API integration for persistent storage
- User registration system
- Team creation and member management
- File upload and storage to cloud/server
- Email notifications
- Advanced reporting and analytics
- Real-time collaboration features
- Payment integration (if applicable)
- Multi-language support
- Dark mode theme

---

**Last Updated**: 2026-09-01  
**Version**: 1.0  
**Project**: REPOFORGE Hackathon Portal
