# ✨ Nexus Student Portal

<div align="center">
  <img src="https://github.com/Nexus-Education/nexus-student-portal/raw/main/public/logo.png" alt="Nexus Logo" width="200"/>
  <br>
  <p><em>Elevate your learning experience with Nexus</em></p>
</div>

## 🚀 Overview

Nexus Student Portal is a modern, feature-rich web application designed to enhance the educational experience for students. With an intuitive interface and powerful features, it enables students to manage their courses, assignments, sessions, and progress all in one place.

## 📋 Technical Architecture

### 🧱 Core Technologies
- **Frontend Framework**: React.js with functional components and hooks
- **Styling**: Tailwind CSS with custom theme configuration
- **Animation**: Framer Motion for fluid UI transitions
- **Routing**: React Router v6 with protected routes
- **Data Fetching**: Axios with request/response interceptors
- **Authentication**: JWT with refresh token mechanism
- **State Management**: React Context API and custom hooks
- **Date/Time Handling**: Day.js with relative time plugins
- **Video Chat**: Integration with ZegoCloud for real-time communications

### 📑 Project Structure
```
student-portal/
├── public/             # Static assets and index.html
└── src/
    ├── assets/         # Icons, images, and other static resources
    ├── components/     # Reusable UI components
    │   ├── dashboard/  # Dashboard-specific components
    │   ├── sessions/   # Session-related components
    │   ├── settings/   # Settings-related components
    │   └── admin/      # Admin interface components
    ├── context/        # React Context providers
    ├── hooks/          # Custom React hooks
    ├── pages/          # Main page components
    │   ├── Lessons/    # Lesson management pages
    │   ├── Notes/      # Notes and resources pages
    │   ├── Profile/    # User profile pages
    │   ├── Assignments/# Assignment pages
    │   └── auth/       # Authentication pages
    ├── routes/         # Application routing configuration
    ├── services/       # API and service integrations
    ├── styles/         # Global styles and Tailwind config
    └── utils/          # Utility functions and helpers
```

### 🧩 Key Components

#### Core UI Components
- **Navbar**: Global navigation with profile menu and notifications
- **Sidebar**: Collapsible navigation sidebar with route links
- **ProtectedRoute**: Authentication wrapper for private routes
- **VideoChat**: Integrated video conferencing component
- **VideoCallButton**: Quick access to join session calls
- **ZegoRoom**: ZegoCloud video room integration

#### Dashboard Components
- **DashboardHeader**: Welcome message and date display
- **NextSessionCard**: Countdown to upcoming sessions
- **AssignmentsOverview**: Pending assignments summary
- **PerformanceChart**: Academic performance visualization
- **TutorRecommendationsSection**: AI-recommended tutors
- **WeeklySchedule**: Calendar view of upcoming sessions

#### Page Components
- **Dashboard**: Main landing page with student overview
- **Lessons**: Session management and history
- **Notes**: Access to shared documents and resources
- **Assignments**: View and submit assignments
- **Profile**: Student profile management
- **Settings**: Application preferences and account settings

### 🔌 Custom Hooks
- **useAuth**: Authentication state and methods
- **useNotifications**: Notification handling
- **useTutorRecommendations**: Fetches and manages tutor recommendations
- **useVideoChat**: Manages video conference state
- **useAssignments**: Handles assignment data and submissions
- **useNotes**: Manages notes and resources data
- **useLessons**: Fetches and manages session data
- **useProgress**: Tracks and displays student progress

### 🛠️ Services

#### API Service
Centralized API client with endpoints grouped by domain:
- **authService**: Authentication operations
- **dashboardService**: Dashboard data retrieval
- **lessonsService**: Session management
- **assignmentsService**: Assignment operations
- **notesService**: Notes and resources operations
- **profileService**: User profile management
- **progressService**: Student progress tracking
- **settingsService**: User settings operations

#### Video Chat Service
Integration with ZegoCloud for real-time video conferencing:
- Room creation and management
- Camera and microphone controls
- Screen sharing capabilities
- Chat messaging during sessions
- Recording functionality

### 🔐 Authentication Flow
1. User logs in with credentials
2. Server returns JWT access and refresh tokens
3. Access token stored for API requests
4. Refresh token used to obtain new access tokens
5. Automatic token refresh via interceptors
6. Protected routes enforce authentication

## ✅ Features

### 📊 Dashboard
- At-a-glance view of your educational journey
- Upcoming lessons countdown timer
- Assignment due dates and urgency indicators
- Performance analytics visualizations
- Weekly schedule overview
- AI-powered tutor recommendations

### 📚 Lessons
- Real-time session management
- Direct access to video meeting links
- Lesson history and materials
- Instructor information
- Session scheduling and rescheduling
- Session notes and recordings

### 📝 Assignments
- Clear due date visibility
- Assignment submission system
- Grade tracking
- Progress indicators
- File upload for submissions
- Rich text editor for written assignments
- Assignment feedback and comments

### 📓 Notes
- Centralized access to all course materials
- Support for multiple file formats (PDF, DOCX, XLSX, etc.)
- Organized by subject and date
- Quick access to recent additions
- Search functionality
- Download and print options

### 🎥 Video Conferencing
- Integrated real-time video sessions
- Screen sharing capabilities
- Chat during sessions
- Recording options
- Whiteboard functionality
- Device management (camera/microphone)

### 👤 Profile Management
- Personal information management
- Learning preferences settings
- Subject preference configuration
- Profile picture customization
- Academic history
- Password management

### ⚙️ Settings
- Account management
- Password controls
- Notification preferences
- Theme customization (Light/Dark modes)
- Accessibility options
- Language preferences

## 🔧 Technology Stack

- **Frontend**: React.js 18.2.0, Framer Motion, Tailwind CSS 3.3.0
- **State Management**: React Context API, Custom Hooks
- **API Client**: Axios 1.4.0
- **Authentication**: JWT
- **Video Conferencing**: ZegoCloud SDK
- **Data Visualization**: Recharts 2.5.0
- **Date Handling**: Day.js 1.11.7
- **Form Handling**: React Hook Form 7.44.1
- **Validation**: Yup 1.2.0
- **Icons**: Heroicons 2.0.18
- **Build Tool**: Vite 4.4.0

## 🏁 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Backend server running (see backend project README)

### Installation

```bash
# Clone the repository
git clone https://github.com/Nexus-Education/nexus-student-portal.git
cd nexus-student-portal

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Configuration

Create a `.env` file with the following variables:
```
VITE_API_URL=http://localhost:8000
VITE_ZEGOCLOUD_APP_ID=your_zegocloud_app_id
VITE_ZEGOCLOUD_SERVER_SECRET=your_zegocloud_server_secret
```

## 🔒 Authentication

The portal uses JWT authentication. Students can access the portal using their credentials provided by the institution. The system maintains session information and will automatically redirect unauthenticated users to the login page.

### Authentication Flow
1. User enters credentials on login page
2. Credentials sent to backend API
3. On successful auth, JWT tokens are returned
4. Access token stored in localStorage
5. Refresh token used to obtain new access tokens
6. API requests include Authorization header

## 🎨 Customization

The application uses Tailwind CSS for styling, making it easy to customize:

- Primary colors can be adjusted in the `tailwind.config.js` file
- Dark mode support is built-in through a toggle in settings
- Responsive design works on all device sizes (mobile-first approach)
- Theme customization available through settings

## 📱 Responsive Design

Nexus Student Portal is designed to work seamlessly on:
- Desktop computers (1200px+)
- Laptops (992px-1199px)
- Tablets (768px-991px)
- Mobile devices (320px-767px)

Responsive features include:
- Collapsible sidebar on smaller screens
- Stacked layouts for mobile views
- Touch-friendly UI elements
- Optimized font sizes and spacing

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Check test coverage
npm run test:coverage
```

## 🚀 Building for Production

```bash
# Build optimized production version
npm run build

# Preview production build locally
npm run preview
```

## 🔍 Future Enhancements

- Real-time notifications
- Integration with calendar applications
- Peer collaboration tools
- Mobile application
- Offline mode support
- Enhanced analytics dashboard
- AI-powered study recommendations
- Internationalization support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contact

For support or inquiries, please reach out to inquiries@nexusacademyuk.com or visit our website at [nexusacademyuk.com](https://nexusacademyuk.com).

---

<div align="center">
  <p>Built with ❤️ by the Nexus Tech Team</p>
</div>
