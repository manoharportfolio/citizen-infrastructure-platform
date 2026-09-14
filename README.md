# Citizen Infrastructure Platform

## Local Setup & Testing Guide

This README contains the complete instructions for setting up, running, and testing the project locally.

---

## 1. Requirements

Install the following:

- Node.js
- npm
- Git
- VS Code
- Google Chrome

Check Node.js:

```bash
node -v
```

Check npm:

```bash
npm -v
```

Check Git:

```bash
git --version
```

---

## 2. Clone the Repository

Clone the GitHub repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Go into the project folder:

```bash
cd citizen-infrastructure-platform
```

Open the project in VS Code:

```bash
code .
```

---

## 3. Project Structure

```text
citizen-infrastructure-platform/
│
├── server/
│   ├── routes/
│   │   └── otpRoutes.js
│   │
│   ├── services/
│   │   ├── emailService.js
│   │   └── phoneService.js
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   │
│   ├── firebase/
│   │   └── config.js
│   │
│   ├── pages/
│   │   ├── CitizenDashboard.jsx
│   │   ├── CitizenLogin.jsx
│   │   ├── CitizenRegister.jsx
│   │   ├── GovernmentDashboard.jsx
│   │   ├── GovernmentLogin.jsx
│   │   ├── GovernmentRegister.jsx
│   │   ├── Home.jsx
│   │   ├── RoleSelection.jsx
│   │   ├── ReportNow.jsx
│   │   └── ReportSomething.jsx
│   │
│   ├── services/
│   │   └── otpService.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .env
├── .gitignore
├── package.json
└── vite.config.js
```

---

# 4. Install Frontend Dependencies

Open the project in VS Code.

Open a terminal:

```text
VS Code
→ Terminal
→ New Terminal
```

Make sure the terminal is inside the main project folder:

```text
citizen-infrastructure-platform
```

Run:

```bash
npm install
```

---

# 5. Install Backend Dependencies

Open another terminal.

Go into the server folder:

```bash
cd server
```

Install backend dependencies:

```bash
npm install
```

After installation, return to the main project folder:

```bash
cd ..
```

---

# 6. Environment Variables

The `.env` files are not included in GitHub.

Create the following files manually:

```text
citizen-infrastructure-platform/
│
├── .env
│
└── server/
    └── .env
```

---

# 7. Frontend Environment File

Create:

```text
.env
```

inside the main project folder.

Add:

```env
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=citizen-infrastructure.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=citizen-infrastructure
VITE_FIREBASE_STORAGE_BUCKET=citizen-infrastructure.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID

VITE_API_URL=http://localhost:5000
```

Use the Firebase configuration provided by the project owner.

---

# 8. Backend Environment File

Create:

```text
server/.env
```

Add:

```env
PORT=5000

EMAILJS_SERVICE_ID=YOUR_EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID=YOUR_EMAILJS_TEMPLATE_ID
EMAILJS_PUBLIC_KEY=YOUR_EMAILJS_PUBLIC_KEY
EMAILJS_PRIVATE_KEY=YOUR_EMAILJS_PRIVATE_KEY

PHONE_OTP_MODE=mock
```

The actual private key should be shared privately with team members.

Do not put the private key in GitHub.

---

# 9. Open Two Terminals in VS Code

The project requires two terminals because the frontend and backend run separately.

```text
Terminal 1 → React Frontend
Terminal 2 → Node.js Backend
```

In VS Code:

```text
Terminal
→ New Terminal
```

This creates Terminal 1.

Then click:

```text
Split Terminal
```

Now you should have:

```text
Terminal 1
Terminal 2
```

---

# 10. Run Frontend

## Terminal 1

Make sure Terminal 1 is in:

```text
citizen-infrastructure-platform
```

Run:

```bash
npm run dev
```

You should see:

```text
Local: http://localhost:5173/
```

Open the frontend:

```text
http://localhost:5173
```

Keep Terminal 1 running.

---

# 11. Run Backend

## Terminal 2

Run:

```bash
cd server
```

Then:

```bash
npm run dev
```

You should see:

```text
Server running on http://localhost:5000
```

Keep Terminal 2 running.

---

# 12. Final Running Setup

Your VS Code terminals should look similar to:

```text
==================================================
TERMINAL 1 — FRONTEND
==================================================

citizen-infrastructure-platform>

npm run dev

Local: http://localhost:5173/


==================================================
TERMINAL 2 — BACKEND
==================================================

citizen-infrastructure-platform/server>

npm run dev

Server running on http://localhost:5000
==================================================
```

Do not close either terminal while testing.

---

# 13. Check Backend

Open:

```text
http://localhost:5000
```

Expected response:

```json
{
  "message": "Citizen Infrastructure API is running."
}
```

If you see this response, the backend is running correctly.

---

# 14. Open Website

Open:

```text
http://localhost:5173
```

The application should load.

---

# 15. Test Role Selection

The first screen asks:

```text
Are you a Citizen or Government Officer?
```

Available options:

```text
Citizen
Government Officer
```

For testing the currently completed citizen features, select:

```text
Citizen
```

---

# 16. Test Citizen Registration

Go to:

```text
Citizen
→ Register
```

Enter:

```text
Name
Date of Birth
Email
Phone Number
Password
Confirm Password
```

---

# 17. Test Email OTP

Click:

```text
Verify
```

next to the email field.

Check the registered email inbox.

Enter the received OTP.

The OTP is valid for:

```text
15 minutes
```

After successful verification:

```text
Email ✓ Verified
```

---

# 18. Test Phone OTP

Click:

```text
Verify
```

next to the phone number.

The current phone OTP system is running in:

```text
mock
```

development mode.

Check:

```text
Terminal 2
```

You should see:

```text
--------------------------------
PHONE OTP - DEVELOPMENT MODE
Phone: +91XXXXXXXXXX
OTP: 123456
Expires in: 15 minutes
--------------------------------
```

Copy the OTP.

Enter it into the phone OTP field.

After successful verification:

```text
Phone ✓ Verified
```

---

# 19. Register Citizen Account

The Register button should remain disabled until:

```text
Email ✓ Verified
Phone ✓ Verified
Password valid
Confirm Password matches
```

Once all requirements are satisfied:

```text
Register
```

will become available.

Click:

```text
Register
```

The user account will be created using Firebase Authentication.

The user's profile is stored in Firestore.

---

# 20. Test Citizen Login

Go to:

```text
Citizen Login
```

Enter:

```text
Email
Password
```

Click:

```text
Login
```

After successful login, you should be redirected to:

```text
Citizen Dashboard
```

---

# 21. Test Citizen Dashboard

The Citizen Dashboard contains:
```text
http://localhost:5173/citizen/dashboard
```

```text
Citizen Dashboard

Report Now

Report Something I Saw

My Reports

My Profile

Logout
```

---

# 22. Test Report Now

From the Citizen Dashboard click:

```text
Report Now
```

Or directly open:

```text
http://localhost:5173/citizen/report
```

---

# 23. Test Current Location

On the Report Now page click:

```text
Use My Current Location
```

Chrome will ask for location permission.

Select:

```text
Allow
```

The page should display:

```text
✓ Location Captured

Latitude: ...
Longitude: ...
Accuracy: ... meters
```

---

# 24. Test Camera

Click:

```text
Capture Evidence
```

Chrome will ask for camera permission.

Select:

```text
Allow
```

The camera preview should appear.

---

# 25. Take Photo

Click:

```text
Take Photo
```

The photo should be captured and displayed.

Test the retake functionality:

```text
Retake Photo
```

The camera should open again.

Take another photo.

---

# 26. Report Now Behavior

Report Now is intended for an infrastructure problem that the citizen is seeing right now.

The flow is:

```text
Report Now
      ↓
Current GPS Location
      ↓
Camera
      ↓
Fresh Photo
```

Report Now does not use gallery upload.

---

# 27. Test Report Something I Saw

Return to:

```text
http://localhost:5173/citizen/dashboard
```

Click:

```text
Report Something I Saw
```

Or directly open:

```text
http://localhost:5173/citizen/report-something
```

---

# 28. Fill Report Something I Saw

Enter:

```text
Date
Time
Location
Category
Description
```

Example:

```text
Date:
2026-09-12

Time:
18:30

Location:
Near ABC School, Hyderabad

Category:
Road Damage / Pothole

Description:
Large pothole near the school entrance.
It is causing difficulty for two-wheelers.
```

---

# 29. Optional Evidence

Evidence is optional for:

```text
Report Something I Saw
```

Click:

```text
Optional Evidence
```

Select an image from your computer.

The selected file should appear:

```text
Evidence selected:
pothole.jpg
```

You can remove it using:

```text
Remove
```

---

# 30. Submit Observation

Click:

```text
Submit Observation
```

You should see:

```text
✓ Observation Recorded
```

Click:

```text
Back to Dashboard
```

to return to the Citizen Dashboard.

---

# 31. Current Report Something I Saw Limitation

At the current development stage, this report is not yet permanently stored in Firestore.

The submitted information is currently logged in the browser console.

Permanent report storage will be added in the next development stage.

---

# 32. Test Logout

From the Citizen Dashboard click:

```text
Logout
```

You should be redirected to:

```text
Citizen Login
```

---

# 33. Complete Citizen Testing

Follow this complete testing sequence:

```text
Open Website
     ↓
Role Selection
     ↓
Citizen
     ↓
Register
     ↓
Enter Details
     ↓
Verify Email
     ↓
Verify Phone
     ↓
Register
     ↓
Citizen Dashboard
     ↓
Logout
     ↓
Citizen Login
     ↓
Login
     ↓
Citizen Dashboard
```

Then test Report Now:

```text
Citizen Dashboard
     ↓
Report Now
     ↓
Use My Current Location
     ↓
Allow Location
     ↓
Location Captured
     ↓
Capture Evidence
     ↓
Allow Camera
     ↓
Camera Preview
     ↓
Take Photo
     ↓
Photo Preview
     ↓
Retake Photo
```

Then test Report Something I Saw:

```text
Citizen Dashboard
     ↓
Report Something I Saw
     ↓
Date
     ↓
Time
     ↓
Location
     ↓
Category
     ↓
Description
     ↓
Optional Evidence
     ↓
Submit Observation
     ↓
Observation Recorded
```

---

# 34. Important URLs

## Main Website

```text
http://localhost:5173
```

## Backend

```text
http://localhost:5000
```

## Citizen Register

```text
http://localhost:5173/citizen/register
```

## Citizen Login

```text
http://localhost:5173/citizen/login
```

## Citizen Dashboard

```text
http://localhost:5173/citizen/dashboard
```

## Report Now

```text
http://localhost:5173/citizen/report
```

## Report Something I Saw

```text
http://localhost:5173/citizen/report-something
```

---

# 35. Troubleshooting — Frontend

If frontend does not start:

```bash
npm install
```

Then:

```bash
npm run dev
```

---

# 36. Troubleshooting — Backend

Go to the server folder:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run dev
```

Expected:

```text
Server running on http://localhost:5000
```

---

# 37. Troubleshooting — Email OTP

If Email OTP does not arrive:

1. Check Terminal 2 is running.
2. Check `server/.env`.
3. Check EmailJS Service ID.
4. Check EmailJS Template ID.
5. Check EmailJS Public Key.
6. Check EmailJS Private Key.
7. Check email spam/junk folder.

---

# 38. Troubleshooting — Phone OTP

Phone OTP is currently running in mock mode.

Check:

```text
Terminal 2
```

The OTP will be printed there.

Example:

```text
PHONE OTP - DEVELOPMENT MODE
OTP: 123456
```

---

# 39. Troubleshooting — Camera

If the camera does not open:

1. Check Chrome camera permission.
2. Set Camera permission to `Allow`.
3. Reload the page.
4. Make sure another application is not using the webcam.

Chrome permission:

```text
Address Bar
     ↓
Camera Permission
     ↓
Allow
```

---

# 40. Troubleshooting — Location

If location does not work:

1. Check Chrome location permission.
2. Set Location permission to `Allow`.
3. Reload the page.
4. Click `Use My Current Location` again.

---

# 41. Troubleshooting — Firebase

If registration or login fails, check Firebase.

Firebase Authentication:

```text
Firebase Console
     ↓
Authentication
     ↓
Sign-in method
     ↓
Email/Password
     ↓
Enabled
```

Firestore must also be enabled.

For local development, make sure:

```text
localhost
```

is allowed as an authorized domain in Firebase Authentication.

---

# 42. Git Commands

Before starting new test:

```bash
git pull
```

---

# 43. Stop the Servers

To stop a running server:

```text
Ctrl + C
```

Do this separately in each terminal.

---

# 44. Restart the Project

## Terminal 1

```bash
npm run dev
```

## Terminal 2

```bash
cd server
npm run dev
```

Open:

```text
http://localhost:5173
```

---



# 45. Quick Start for Team Members

If the environment files are already available:

```bash
git clone https://github.com/manoharportfolio/citizen-infrastructure-platform.git
```

```bash
cd citizen-infrastructure-platform
```

Install frontend:

```bash
npm install
```

Install backend:

```bash
cd server
npm install
```

Return to root:

```bash
cd ..
```

Open two VS Code terminals.

### Terminal 1

```bash
npm run dev
```

### Terminal 2

```bash
cd server
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 46. Current Features Available for Testing

```text
Citizen Registration       ✅
Citizen Login              ✅
Email OTP                  ✅
Phone OTP (Mock)           ✅
Firebase Authentication    ✅
Firestore User Profile     ✅
Citizen Dashboard          ✅
Report Now                 ✅
GPS Location               ✅
Camera Evidence            ✅
Retake Photo               ✅
Report Something I Saw     ✅
Optional Evidence          ✅
```

---

# 47. Current Status

The current version is ready for local team testing.

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

Both servers must be running at the same time.

```text
Terminal 1
→ npm run dev

Terminal 2
→ cd server
→ npm run dev
```

---

## END OF LOCAL SETUP & TESTING GUIDE