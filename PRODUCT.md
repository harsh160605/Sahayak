# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Institute Admin**: Institutional executive responsible for onboarding the institute, configuring academic years, managing departments, and allocating division hierarchies and faculty responsibilities.
- **Head of Department (HOD)**: Departmental lead overseeing subject offerings, division allocations, and faculty teaching assignments.
- **Faculty / Teachers**: Instructors managing live lecture & practical sessions, hosting rotating anti-proxy QR screens, reviewing enrollment requests, and tracking attendance defaulters (<75%).
- **Enrolled Students**: College/university students scanning dynamic QR codes in class, tracking verified attendance percentages, and viewing division timetables and schedules.

## Product Purpose

SmartAttend is a real-time attendance management and institutional governance platform designed for universities and colleges. It replaces vulnerable manual roll-calls and static QR codes with cryptographically rotating tokens and geofencing, ensuring foolproof physical classroom attendance and administrative transparency.

## Positioning

Unlike generic attendance apps or administrative ERPs that rely on static sheets, easily spoofed barcodes, or static QR codes (which students photograph and share via group chats), SmartAttend generates rotating cryptographic tokens (3–5 second lifespan) synchronized with student device scanning and GPS geofencing, making proxy attendance physically and cryptographically impossible.

## Operating Context

- **Classrooms & Lecture Halls**: Faculty project live dynamic QR codes on high-contrast projector displays or monitors at the front of the room.
- **Student Mobile Web**: Students scan the rotating QR code in real-time from their mobile browsers or smart devices while connected to campus networks within geofenced boundaries.
- **Administrative Offices**: Administrators and HODs configure hierarchical structures (Academic Years, Departments, Year of Study 1st–4th, Divisions A/B/C) and manage weekly timetables with automated faculty conflict prevention.

## Capabilities and Constraints

- **Dynamic Rotating QR Codes**: Real-time token rotation every 3 to 5 seconds with visual countdown ring and server-side cryptographic validation.
- **Geofencing Verification**: Classroom/campus coordinate geofencing to prevent remote off-campus attendance marking.
- **Hierarchical Governance**: Strict relational structure: Institute -> Departments -> Academic Years -> Year of Study -> Divisions -> Students & Faculty.
- **Intelligent Timetable Engine**: Visual weekly grid with multi-faculty practical allocations, break definitions, and cross-division conflict prevention.
- **Attendance Thresholds & Analytics**: 75% mandatory threshold monitoring, automated defaulter lists, and one-click CSV report exports.
- **Technology Stack**: React 18, TypeScript, Tailwind CSS, Vite, and Firebase (Authentication, Firestore, Security Rules).

## Brand Commitments

- **Tone & Identity**: Professional, academic editorial, modern, and reliable.
- **Visual Identity**: Warm neutral surfaces (`#FBFBFA`), deep navy typography (`#0F172A`), restrained teal accents (`#0D9488`), and clean structural hierarchy.

## Evidence on Hand

- Fully operational React + Vite + TypeScript codebase with Firebase Auth & Firestore integration.
- Implemented rotating QR engine with countdown canvas animation (`html5-qrcode`, `canvas-confetti`).
- Implemented guided 6-step Institute Onboarding Wizard and complete Admin Hierarchy Console.
- Implemented visual weekly Timetable Builder with cross-division faculty conflict prevention.

## Product Principles

1. **Foolproof Physical Truth**: Zero tolerance for proxy attendance; attendance requires physical presence, temporal synchronization, and cryptographic validity.
2. **Effortless Administrative Hierarchy**: Structural changes (departments, divisions, faculty assignments) should take seconds, never multi-hour manual data entry.
3. **Restrained Academic Polish**: High scanability, clean data density, and calm editorial aesthetics suited for high-stakes institutional environments.
4. **Immediate Feedback & Graceful Degradation**: Clear visual feedback (countdown rings, celebration confetti, conflict alerts) with resilient local fallbacks even in offline/demo modes.

## Accessibility & Inclusion

- Responsive web interface accessible across desktop monitors, classroom projectors, tablets, and varied mobile smartphones.
- High-contrast projector mode for large lecture halls and varied ambient lighting conditions.
- Clear error states, accessible color-contrast ratios, and keyboard-friendly form navigations.

