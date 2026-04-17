const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Twilio setup (optional - will log to console if not configured)
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

const KITCHEN_PHONE = process.env.KITCHEN_PHONE;
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data.json if it doesn't exist
function initializeDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      students: [],
      preRegistrations: [],
      registrations: [],
      wastelog: [],
      sentAlerts: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read data.json
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data.json:', err);
    return { students: [], preRegistrations: [], registrations: [], wastelog: [], sentAlerts: [] };
  }
}

// Write to data.json
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to data.json:', err);
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// ==================== API ROUTES ====================

// Route 1: Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/kitchen', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kitchen.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route 2: POST /register - Student registers for meals
app.post('/register', (req, res) => {
  try {
    const { meals } = req.body;
    const date = getTodayDate();

    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ error: 'No meals selected' });
    }

    const data = readData();

    // Add each meal as a separate registration entry
    meals.forEach(meal => {
      data.registrations.push({
        date: date,
        meal: meal,
        count: 1
      });
    });

    writeData(data);

    res.json({
      success: true,
      message: `Registered for ${meals.join(', ')}`,
      date: date,
      meals: meals
    });
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Route 3: GET /registrations - Fetch all registrations
app.get('/registrations', (req, res) => {
  try {
    const data = readData();
    res.json(data.registrations);
  } catch (err) {
    console.error('Error in /registrations:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Route 3.1: POST /register-student - One-time student registration
app.post('/register-student', (req, res) => {
  try {
    const { name, rollno, section } = req.body;

    if (!name || !rollno || !section) {
      return res.status(400).json({ error: 'Name, rollno, and section required' });
    }

    const data = readData();

    // Check if student already exists
    const existingStudent = data.students.find(s => s.rollno === rollno);
    if (existingStudent) {
      return res.status(400).json({ error: 'Student already registered' });
    }

    data.students.push({
      name: name,
      rollno: rollno,
      section: section
    });

    writeData(data);

    res.json({
      success: true,
      message: `Student ${name} registered successfully`
    });
  } catch (err) {
    console.error('Error in /register-student:', err);
    res.status(500).json({ error: 'Student registration failed' });
  }
});

// Route 3.2: POST /pre-register - Pre-register for meals
app.post('/pre-register', (req, res) => {
  try {
    const { rollno, meals } = req.body;
    const date = getTodayDate();

    if (!rollno || !meals || !Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ error: 'Rollno and meals required' });
    }

    const data = readData();

    // Check if student exists
    const student = data.students.find(s => s.rollno === rollno);
    if (!student) {
      return res.status(400).json({ error: 'Student not registered. Please register first.' });
    }

    // Remove existing pre-registration for today
    data.preRegistrations = data.preRegistrations.filter(pr => !(pr.rollno === rollno && pr.date === date));

    // Add new pre-registration
    data.preRegistrations.push({
      rollno: rollno,
      meals: meals,
      date: date
    });

    writeData(data);

    res.json({
      success: true,
      message: `Pre-registered for ${meals.join(', ')}`
    });
  } catch (err) {
    console.error('Error in /pre-register:', err);
    res.status(500).json({ error: 'Pre-registration failed' });
  }
});

// Route 3.3: GET /pre-registrations - Fetch pre-registrations for today
app.get('/pre-registrations', (req, res) => {
  try {
    const data = readData();
    const today = getTodayDate();
    const todayPreRegs = data.preRegistrations.filter(pr => pr.date === today);
    res.json(todayPreRegs);
  } catch (err) {
    console.error('Error in /pre-registrations:', err);
    res.status(500).json({ error: 'Failed to fetch pre-registrations' });
  }
});

// Route 3.4: GET /waste-log - Fetch all waste logs
app.get('/waste-log', (req, res) => {
  try {
    const data = readData();
    res.json(data.wastelog);
  } catch (err) {
    console.error('Error in /waste-log:', err);
    res.status(500).json({ error: 'Failed to fetch waste logs' });
  }
});

// Route 4: POST /send-sms - Admin sends SMS alert to kitchen
app.post('/send-sms', (req, res) => {
  try {
    const { meal, prediction } = req.body;

    if (!meal || prediction === undefined) {
      return res.status(400).json({ error: 'Meal and prediction required' });
    }

    // Save alert to data.json so kitchen can read it
    const data = readData();
    if (!data.sentAlerts) data.sentAlerts = [];
    // Remove previous alert for same meal+date
    const today = getTodayDate();
    data.sentAlerts = data.sentAlerts.filter(a => !(a.meal === meal && a.date === today));
    data.sentAlerts.push({
      meal: meal,
      prediction: Math.round(prediction),
      date: today,
      sentAt: new Date().toISOString()
    });
    writeData(data);

    const message = `Meal Alert: ${meal.toUpperCase()} - Predicted portions: ${Math.round(prediction)}. Please prepare accordingly!`;

    if (!client) {
      console.log('SMS Stub:', message);
      return res.json({
        success: true,
        message: `Alert sent for ${meal}: ${Math.round(prediction)} portions`
      });
    }

    client.messages
      .create({
        body: message,
        from: process.env.TWILIO_FROM,
        to: KITCHEN_PHONE
      })
      .then(msg => {
        console.log(`SMS sent with SID: ${msg.sid}`);
        res.json({
          success: true,
          message: `SMS alert sent for ${meal}`,
          smsId: msg.sid
        });
      })
      .catch(err => {
        console.error('Twilio error:', err);
        res.status(500).json({ error: 'Failed to send SMS' });
      });
  } catch (err) {
    console.error('Error in /send-sms:', err);
    res.status(500).json({ error: 'SMS sending failed' });
  }
});

// Route 4.1: GET /sent-alerts - Fetch today's sent alerts for kitchen display
app.get('/sent-alerts', (req, res) => {
  try {
    const data = readData();
    const today = getTodayDate();
    const alerts = (data.sentAlerts || []).filter(a => a.date === today);
    res.json(alerts);
  } catch (err) {
    console.error('Error in /sent-alerts:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});


// Route 5: POST /log-waste - Admin logs actual cooked quantity
app.post('/log-waste', (req, res) => {
  try {
    const { meal, predicted, actual } = req.body;
    const date = getTodayDate();

    if (!meal || predicted === undefined || actual === undefined) {
      return res.status(400).json({ error: 'Meal, predicted, and actual required' });
    }

    const data = readData();

    data.wastelog.push({
      date: date,
      meal: meal,
      predicted: predicted,
      actual: actual
    });

    writeData(data);

    res.json({
      success: true,
      message: `Waste logged for ${meal}`,
      predicted: predicted,
      actual: actual,
      delta: actual - predicted
    });
  } catch (err) {
    console.error('Error in /log-waste:', err);
    res.status(500).json({ error: 'Failed to log waste' });
  }
});

// Route 6: GET /waste-log - Fetch waste history
app.get('/waste-log', (req, res) => {
  try {
    const data = readData();
    res.json(data.wastelog);
  } catch (err) {
    console.error('Error in /waste-log:', err);
    res.status(500).json({ error: 'Failed to fetch waste log' });
  }
});

// Route 7: POST /reset-data - Reset all data
app.post('/reset-data', (req, res) => {
  try {
    const freshData = {
      students: [],
      preRegistrations: [],
      registrations: [],
      wastelog: [],
      sentAlerts: []
    };
    writeData(freshData);
    res.json({ success: true, message: 'All data has been reset' });
  } catch (err) {
    console.error('Error in /reset-data:', err);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// ==================== START SERVER ====================

initializeDataFile();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🍽️  Kitchen: http://localhost:${PORT}/kitchen`);
  console.log(`👤 Student: http://localhost:${PORT}/student`);
});
