
# citizen-infrastructure-platform

> Report. Verify. Prioritize. Act.

citizen-infrastructure-platform is an AI-powered citizen infrastructure reporting platform that allows citizens to report public infrastructure problems, verify complaint evidence using AI, and explore complaints through a location-based map.

---

## 🚀 Challenge

### Build with AI: Code for Communities — Second Edition

**Track:** AI for Digital Public Infrastructure & Governance

### Challenge Taken

We selected the challenge of building a platform that helps citizens report infrastructure problems using **text, images, and location data**.

The platform focuses on collecting citizen complaints and converting them into useful location-based public intelligence.

### Problems We Address

- Citizens need an easier way to report infrastructure problems.
- Similar complaints can be reported multiple times.
- It can be difficult to understand which areas have more reported problems.
- Complaint evidence may not always match the reported issue.
- Citizens need a simple way to explore problems reported in their area.

---

## 💡 Our Solution

citizen-infrastructure-platform allows citizens to:

- Report infrastructure problems.
- Upload photographic evidence.
- Automatically capture their location.
- Verify complaint evidence using Gemini AI.
- View AI-based evidence confidence.
- Group and identify similar complaints.
- Explore complaints on a map.
- View complaint hotspots.
- View area-wise complaint statistics.
- View individual complaint details.

Users can explore public complaints without logging in.

Login is required only when submitting a complaint.

---

## 🤖 AI Features

citizen-infrastructure-platform uses **Google Gemini** to analyze complaint evidence.

The AI checks:

- What issue is visible in the image.
- Whether the selected category matches the image.
- Whether the description matches the image.
- Evidence consistency.
- Confidence of the visual analysis.

The AI analysis is used as an **evidence-assistance system**, not as absolute proof that a complaint is true.

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Bootstrap
- React Router
- Leaflet
- React Leaflet

### Backend
- Node.js
- Express.js

### Database & Authentication
- Firebase Authentication
- Firebase Firestore

### AI
- Google Gemini API

### Image Storage
- ImageKit

### Email
- EmailJS

---

## 📁 Project Structure

```text
citizen-infrastructure-platform/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── firebase/
│   ├── data/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── server/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

# ⚙️ Run Locally

## 1. Clone the Repository

```bash
git clone https://github.com/manoharportfolio/citizen-infrastructure-platform.git
cd citizen-infrastructure-platform
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root.

```env
VITE_API_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
```

Create another `.env` inside the `server` folder.

```env
PORT=5000

FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY=YOUR_FIREBASE_PRIVATE_KEY

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=YOUR_GEMINI_MODEL

IMAGEKIT_PRIVATE_KEY=YOUR_IMAGEKIT_PRIVATE_KEY
IMAGEKIT_PUBLIC_KEY=YOUR_IMAGEKIT_PUBLIC_KEY
IMAGEKIT_URL_ENDPOINT=YOUR_IMAGEKIT_URL_ENDPOINT

EMAILJS_SERVICE_ID=YOUR_EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID=YOUR_EMAILJS_TEMPLATE_ID
EMAILJS_PUBLIC_KEY=YOUR_EMAILJS_PUBLIC_KEY
EMAILJS_PRIVATE_KEY=YOUR_EMAILJS_PRIVATE_KEY
```

**Do not commit `.env` files to GitHub.**

---

# 🔥 Firebase Setup

Create a Firebase project and enable:

- Firebase Authentication
- Email/Password Authentication
- Firestore Database

The application stores citizen profiles in:

```text
users/{uid}
```

with information such as:

```text
fullName
email
phoneNumber
role
emailVerified
accountStatus
```

---

# 📧 Email OTP

Email OTP is used for:

- New account registration
- Forgot password

Phone OTP is not required.

EmailJS is used by the backend to send the OTP emails.

---

# ▶️ Start the Application

You need **two terminals**.

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

### Terminal 2 — Frontend

From the project root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🧭 Main User Flow

```text
Public Website
      │
      ├── Explore Complaints
      │       ├── Map
      │       ├── Hotspots
      │       ├── Area Statistics
      │       └── Complaint Details
      │
      └── Report an Issue
              │
              ▼
           Login
              │
              ▼
      Report Now / Report Something
              │
              ▼
        Location + Evidence
              │
              ▼
          ImageKit
              │
              ▼
          Gemini AI
              │
              ▼
       Evidence Analysis
              │
              ▼
        Firestore Database
              │
              ▼
       Public Complaint Map
```

---

# 👥 Team

**Team Name:** Brute Force Squad

### **Team Members**

- **Manohar — Team Leader**
- **Saba Fathima**
- Saiid Ahmad

---

## 🎯 Hackathon

Built for:

**Build with AI: Code for Communities — Second Edition**

**Track:** AI for Digital Public Infrastructure & Governance

---

## 📌 Project Status

citizen-infrastructure-platform is a hackathon prototype demonstrating how AI, citizen-generated reports, location intelligence, and evidence analysis can be combined into a public infrastructure reporting platform.

---

## 📄 License

This project was created as a hackathon project.
