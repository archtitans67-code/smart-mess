# 🍽️ Smart Mess — Meal Waste Prediction System

A smart meal planning system for hostel and college canteens that predicts meal portions, reduces food waste, and keeps kitchen staff informed via SMS alerts.

## 📌 Problem Statement

In college hostels, kitchens don't know how many students will attend each meal. This leads to:
- **Overcooked food** → waste of food and money
- **Undercooked food** → students go hungry

Smart Mess solves this by letting students pre-register for meals and using a **weighted prediction formula** to forecast how many portions to cook.

## 🏗️ Architecture

```
Browser (Frontend)          Server (Backend)           Storage
──────────────────          ────────────────           ───────
index.html                  server.js (Express)        data.json
student.html          ←→    ├── 8 API endpoints   ←→   .env
admin.html + Chart.js       ├── Twilio SMS
kitchen.html + predict.js   └── Static file server
style.css (shared)
```

## ✨ Features

| Feature | Description |
|---|---|
| **Student Registration** | One-time signup with name, roll number, section |
| **Meal Pre-Registration** | Students select breakfast, lunch, or dinner daily |
| **Prediction Engine** | Weighted formula predicts portions using today's data + 7-day avg + weekly pattern |
| **Admin Dashboard** | Live stats, bar/line charts, accuracy tracking |
| **SMS Alerts** | Admin sends portion alerts to kitchen staff via Twilio |
| **Kitchen Dashboard** | Displays predictions and admin alerts (auto-refreshes every 30s) |
| **Waste Tracking** | Admin logs actual vs predicted to improve future accuracy |
| **Data Reset** | One-click reset from admin panel |
| **Responsive UI** | Works on desktop, tablet, and mobile |

## 📊 Prediction Formula

```
Prediction = (0.5 × Today's Pre-Registrations)
           + (0.3 × Average of Last 7 Days)
           + (0.2 × Same Weekday Last Week)
```

| Weight | Data Source | Reasoning |
|---|---|---|
| 50% | Today's sign-ups | Most reliable — students confirmed attendance |
| 30% | 7-day rolling average | Captures recent trends |
| 20% | Same weekday last week | Captures weekly patterns (e.g., biryani day) |

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Server runtime |
| **Express.js** | Web framework & API routing |
| **HTML/CSS/JS** | Frontend (vanilla, no frameworks) |
| **Chart.js** | Bar and line chart visualizations |
| **Twilio API** | SMS notifications to kitchen |
| **dotenv** | Environment variable management |
| **JSON file** | Flat-file database (`data.json`) |

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- Twilio account (optional — app works without it, SMS logged to console)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-mess.git
cd smart-mess

# Install dependencies
npm install

# Configure environment variables
# Edit .env with your Twilio credentials (see below)

# Start the server
node server.js
```

### Environment Variables (`.env`)

```env
PORT=3000
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890
KITCHEN_PHONE=+919876543210
```

> **Note:** If Twilio credentials are not set, SMS alerts are logged to the console instead. The app still works fully.

### Running

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
smart-mess/
├── .env                  # Twilio credentials & config
├── .gitignore            # Files excluded from git
├── package.json          # Dependencies & scripts
├── server.js             # Express backend (all API routes)
├── data.json             # Flat-file database (auto-created)
└── public/
    ├── style.css         # Global styles (shared by all pages)
    ├── predict.js        # Prediction algorithm (client-side)
    ├── index.html        # Home — role selection
    ├── student.html      # Student registration & pre-registration
    ├── admin.html        # Admin dashboard
    └── kitchen.html      # Kitchen predictions & alerts
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register-student` | Register a new student (name, rollno, section) |
| `POST` | `/pre-register` | Pre-register for today's meals |
| `GET` | `/pre-registrations` | Get today's pre-registrations |
| `POST` | `/send-sms` | Send SMS alert to kitchen + save alert |
| `GET` | `/sent-alerts` | Get today's sent alerts |
| `POST` | `/log-waste` | Log actual vs predicted portions |
| `GET` | `/waste-log` | Get waste log history |
| `POST` | `/reset-data` | Reset all data to empty |

## 📱 Pages & Access

| Page | URL | Access |
|---|---|---|
| Home | `/` | Public |
| Student Portal | `/student` | Public |
| Kitchen Dashboard | `/kitchen` | PIN: `1234` |
| Admin Dashboard | `/admin` | PIN: `1234` |

## 🔮 Future Improvements

- Replace JSON storage with MongoDB/PostgreSQL
- Add server-side authentication with JWT
- Implement ML model (regression/LSTM) for better predictions
- Add WebSocket for real-time updates (instead of polling)
- QR code based meal attendance
- Weekly/monthly analytics reports
- Mobile app using React Native

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.