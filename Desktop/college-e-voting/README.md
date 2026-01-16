# 🗳️ College E-Voting System

A modern, secure, and real-time college election voting platform built with Firebase and vanilla JavaScript. Features OTP-based authentication, real-time vote counting, admin dashboard, and beautiful glassmorphic UI.

## ✨ Features

### 🔐 Security & Authentication
- **Admin Authentication**: Secure email/password login for election administrators
- **OTP-Based Student Authentication**: Two-step verification process via email
- **Vote Prevention**: Students cannot vote twice - system tracks voting status
- **Suspicious Activity Monitoring**: Tracks multiple login attempts

### 🗳️ Voting System
- **Grouped Candidates**: Candidates organized by position/role
- **Radio Button Selection**: Clean interface for selecting candidates
- **Real-Time Vote Counting**: Live updates to vote tallies as votes are submitted
- **Voting Status Control**: Admin can start/stop voting sessions with automatic vote clearing
- **Vote Tracking**: Timestamp and admission number recording for audit trails

### 📊 Admin Dashboard
- **Real-Time Results Graph**: Live horizontal bar chart showing vote distribution
- **Candidate Management**: Add/remove candidates with position assignment
- **Student Management**: Register voting-eligible students
- **Winner Display**: Automatic winner calculation and prominent display when voting ends
- **Voting Toggle**: Start/stop voting with one click
- **Suspicious Attempts Table**: Monitor suspicious login activities
- **Responsive Design**: Works seamlessly on desktop and tablet

### 👥 Student Interface
- **Modern Login Flow**: Two-step OTP verification with step indicators
- **Clean Voting Interface**: Organized candidate cards grouped by position
- **Vote Confirmation**: Real-time feedback after vote submission
- **Logout Functionality**: Easy session exit

### 🎨 User Experience
- **Glassmorphic Design**: Modern UI with backdrop blur effects
- **Purple Gradient Theme**: Cohesive visual design across all pages
- **Smooth Animations**: Sliding cards and fade-in effects
- **Responsive Layout**: Works on all device sizes
- **Real-Time Feedback**: Status messages for all user actions

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend/Database**: Firebase Firestore (Real-time Database)
- **Authentication**: Firebase Authentication + OTP via EmailJS
- **Charts**: Chart.js for vote visualization
- **Barcode Scanning**: ZXing.js library (optional)
- **Deployment**: Firebase Hosting

## 📦 Project Structure

```
college-e-voting/
├── public/
│   ├── index.html              # Landing page with login options
│   ├── admin.html              # Admin login page
│   ├── student.html            # Student OTP verification
│   ├── vote.html               # Voting interface
│   ├── dashboard.html          # Admin dashboard
│   ├── css/
│   │   └── style.css           # Legacy styles (optional)
│   ├── js/
│   │   ├── firebase-config.js  # Firebase initialization
│   │   ├── admin-auth.js       # Admin authentication logic
│   │   ├── admin-dashboard.js  # Dashboard functionality
│   │   ├── student-auth.js     # Student OTP & login
│   │   ├── vote.js             # Voting logic
│   │   └── barcode-scan.js     # Barcode scanning (optional)
├── firebase.json               # Firebase hosting config
├── README.md                   # Project documentation
└── Y/
    └── index.html              # Backup/alternate landing page
```

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project account
- EmailJS account for OTP delivery

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/college-e-voting.git
   cd college-e-voting
   ```

2. **Set Up Firebase Project**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Firebase Authentication (Email/Password)
   - Create collections: `students`, `candidates`, `votes`, `emailOtps`, `system`

3. **Configure Firebase Credentials**
   - Update `public/js/firebase-config.js` with your Firebase config:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Set Up EmailJS for OTP**
   - Create EmailJS account at [EmailJS](https://www.emailjs.com)
   - In `public/js/student-auth.js`, update:
   ```javascript
   emailjs.init("YOUR_PUBLIC_KEY");
   // And update the send method:
   emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {...})
   ```

5. **Deploy to Firebase Hosting**
   ```bash
   firebase login
   firebase deploy
   ```

## 📖 Usage Guide

### 🔑 Admin Portal

1. **Access Admin Login**
   - Navigate to `/admin.html`
   - Login with admin email and password

2. **Manage Candidates**
   - Add candidates by entering: ID, Name, Email, Position
   - View all candidates organized by position
   - Delete candidates as needed

3. **Manage Students**
   - Register students by entering: Admission Number, Email
   - Only registered students can vote

4. **Control Voting**
   - Click **"Start Voting"** to begin election
   - All votes are cleared when a new session starts
   - Click **"Stop Voting"** to end session
   - Winner automatically displays when voting stops

5. **Monitor Results**
   - Real-time vote graph updates as students vote
   - Horizontal bar chart shows vote distribution per candidate
   - Position-wise grouping for clear results

### 🗳️ Student Portal

1. **Access Student Login**
   - Navigate to `/student.html` or click "Student Login" on homepage

2. **Step 1: Enter Details**
   - Name, Admission Number, Email
   - Click "Send OTP"
   - OTP sent to registered email

3. **Step 2: Verify OTP**
   - Enter OTP received in email
   - Click "Verify & Login"
   - Redirected to voting page

4. **Cast Your Vote**
   - Candidates organized by position
   - Select one candidate per position (radio buttons)
   - Click "Submit Vote"
   - Confirmation message appears
   - Cannot vote again in same session

## 🔒 Firestore Collection Schema

### `students` Collection
```javascript
{
  "admissionNo": "ADM001",
  "name": "Student Name",
  "email": "student@college.edu",
  "hasVoted": false
}
```

### `candidates` Collection
```javascript
{
  "candidateId": "CAN001",
  "name": "Candidate Name",
  "email": "candidate@college.edu",
  "position": "President"
}
```

### `votes` Collection
```javascript
{
  "admissionNo": "ADM001",
  "candidateId": "CAN001",
  "timestamp": "2026-01-16T10:30:00Z"
}
```

### `emailOtps` Collection
```javascript
{
  "otp": "123456",
  "admissionNo": "ADM001",
  "createdAt": "2026-01-16T10:30:00Z"
}
```

### `system` Collection
```javascript
{
  "votingStatus": {
    "enabled": true/false,
    "startedAt": "timestamp"
  }
}
```

## 🎨 Design System

### Color Palette
- **Primary Gradient**: `#667eea` → `#764ba2` (Purple)
- **Accent**: `#f093fb` (Pink)
- **Text Dark**: `#333333`
- **Text Light**: `#999999`
- **Background**: `rgba(255, 255, 255, 0.95)` (White with transparency)

### Typography
- **Font Family**: Inter (from Google Fonts)
- **Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### UI Components
- **Cards**: Glassmorphic with 20px blur and 0.95 opacity
- **Buttons**: Gradient background with hover animation
- **Inputs**: Soft focus states with subtle shadows
- **Messages**: Color-coded (red for errors, green for success)

## 📱 Responsive Design

- **Desktop**: Full-featured dashboard with 2-column layout
- **Tablet** (768px): Adjusted spacing and font sizes
- **Mobile** (600px): Single-column layout, optimized touch targets

## 🔄 Real-Time Features

### Vote Graph Updates
- Listens to `votes` collection in real-time
- Updates chart within 300ms of new votes
- Shows vote counts per candidate
- Updates after each vote submission

### Voting Status Updates
- Admin toggle instantly reflects in student UI
- Students cannot vote when voting is disabled
- Automatic disabling on vote session end

### Live Candidate List
- Real-time updates when candidates added/removed
- Position-based grouping automatic

## 🐛 Troubleshooting

### OTP Not Sending
- ✅ Check EmailJS credentials in `student-auth.js`
- ✅ Verify email template exists in EmailJS dashboard
- ✅ Check student email is correct
- ✅ Check browser console for error messages

### Admin Dashboard Not Loading
- ✅ Verify Firebase authentication with admin account
- ✅ Check Firebase project permissions
- ✅ Clear browser cache and reload
- ✅ Ensure admin is logged in (redirects to login if not)

### Votes Not Updating
- ✅ Verify Firestore `votes` collection exists
- ✅ Check real-time listener console logs
- ✅ Ensure student hasn't already voted
- ✅ Refresh page and try again

### Graph Not Showing
- ✅ Verify Chart.js library loaded
- ✅ Check candidates exist in Firestore
- ✅ Check votes have been recorded
- ✅ Verify `resultsChart` canvas element exists

## 🚀 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Project**
   ```bash
   firebase init
   ```

3. **Deploy to Production**
   ```bash
   firebase deploy
   ```

4. **View Live Site**
   - Firebase provides hosting URL after deployment
   - Typically: `https://college-e-voting.firebaseapp.com`

### Custom Domain Setup
- Add custom domain in Firebase Console
- Follow Firebase instructions for DNS setup
- SSL certificate auto-generated

## 📊 Analytics & Monitoring

### Admin Dashboard Insights
- Total votes cast per position
- Voting participation rates
- Real-time vote distribution
- Suspicious activity alerts
- Winner calculation

### Firebase Console
- Monitor Firestore read/write operations
- Check authentication logs
- View real-time database usage
- Set up custom alerts

## 🔐 Security Best Practices

✅ **Implemented**
- OTP-based verification
- Firebase Authentication
- Vote prevention (hasVoted flag)
- Firestore security rules (recommended)

✅ **Recommended Additional**
- Enable Firestore Security Rules in Firebase Console
- Set up HTTPS-only access
- Implement rate limiting for OTP requests
- Regular database backups
- Audit trail for all operations

## 📝 Firestore Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Reshmi Raj**
- GitHub: [your-github-profile]
- Email: your-email@college.edu

## 🙏 Acknowledgments

- Firebase for real-time database and hosting
- EmailJS for OTP delivery
- Chart.js for beautiful visualizations
- ZXing.js for barcode scanning capabilities

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Check Firebase documentation: https://firebase.google.com/docs

---

**Last Updated**: January 16, 2026  
**Version**: 1.0.0

🎉 **Happy Voting!** 🗳️
