# SmartAttend — Real-Time QR-Based Attendance Management System

SmartAttend is a modern, responsive web application for colleges and universities designed to eliminate proxy attendance and streamline classroom management. Built with React, TypeScript, Tailwind CSS, and Firebase.

---

## 🌟 Key Features

1. **Dynamic Rotating QR Codes (USP)**:
   - Rotates cryptographic tokens every **3 seconds** (standard) or **5 seconds** (large lecture halls).
   - Visual countdown ring and projector-optimized high-contrast presentation mode.
   - Server-side token validation preventing screenshots, replayed tokens, or clock-tampered scans.
2. **Dual-Role Academic Portals**:
   - **Faculty / Teacher**: Course creation, student roster management, live session projector screen, enrollment request review, defaulter threshold tracking (&lt;75%), and CSV attendance export.
   - **Enrolled Student**: Course catalog explorer, one-click enrollment requests, camera QR scanner with confetti confirmation, and attendance warnings.
3. **Academic Editorial Design**:
   - Fully styled following the `premium-ui-design` skill: warm neutral surfaces (`#FBFBFA`), deep navy typography (`#0F172A`), restrained teal accents (`#0D9488`), and clear visual hierarchy.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

The application will start on `http://localhost:5173`.

---

## 🔑 Demo & Testing Accounts

SmartAttend includes instant 1-click evaluation profiles for testing:
- **Faculty / Teacher Role**: Dr. Alok Sharma (`FAC-CS-104`, Computer Science)
- **Student Role**: Aarav Patel (`22CS042`, 6th Semester)

You can toggle between roles anytime from the sidebar or the login page.

---

## 🔒 Firebase Configuration & Deployment

To connect to a live Firebase backend:
1. Copy `.env.example` to `.env`.
2. Enter your Firebase project keys from the [Firebase Console](https://console.firebase.google.com).
3. Deploy the included security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Build the production bundle:
   ```bash
   npm run build
   ```

