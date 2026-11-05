const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Dashboard API: Serves the master overview list from lessons.json
app.get('/api/lessons', (req, res) => {
    const masterFile = path.join(__dirname, 'data', 'lessons.json');
    
    if (fs.existsSync(masterFile)) {
        try {
            const fileContent = fs.readFileSync(masterFile, 'utf8');
            const lessons = JSON.parse(fileContent);
            lessons.sort((a, b) => (a.id || 0) - (b.id || 0));
            return res.json(lessons);
        } catch (parseErr) {
            console.error('Error parsing lessons.json:', parseErr);
            return res.status(500).json({ error: 'Failed to parse master lesson data' });
        }
    } else {
        return res.status(404).json({ error: 'Master lessons.json file not found.' });
    }
});

// 2. Call Lesson API: Fetches the deep, granular individual file (e.g., lesson1.json, lesson3.json) when clicked
app.get('/api/lesson/:id', (req, res) => {
    const lessonId = req.params.id;
    const filePath = path.join(__dirname, 'data', `lesson${lessonId}.json`);

    if (fs.existsSync(filePath)) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lessonData = JSON.parse(fileContent);
            return res.json(lessonData);
        } catch (err) {
            console.error(`Error parsing lesson ${lessonId}:`, err);
            return res.status(500).json({ error: 'Failed to parse lesson detail data' });
        }
    } else {
        return res.status(404).json({ error: `Detailed file for Lesson ${lessonId} not found.` });
    }
});

// Student Submissions API
app.post('/api/submit-lesson', (req, res) => {
    const submission = req.body;
    submission.date = new Date().toLocaleDateString();
    
    const submissionsFile = path.join(__dirname, 'data', 'submissions.json');
    
    let submissions = [];
    if (fs.existsSync(submissionsFile)) {
        try {
            submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        } catch (e) {
            submissions = [];
        }
    }
    
    submissions.push(submission);
    
    try {
        fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
        res.json({ success: true, message: 'Responses successfully submitted!' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save submission.' });
    }
});

// Get Submissions API for Teacher View
app.get('/api/submissions', (req, res) => {
    const submissionsFile = path.join(__dirname, 'data', 'submissions.json');
    if (fs.existsSync(submissionsFile)) {
        try {
            const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
            return res.json(submissions);
        } catch (e) {
            return res.json([]);
        }
    }
    res.json([]);
});

// Teacher Auth API
app.post('/api/teacher-auth', (req, res) => {
    const { passcode } = req.body;
    if (passcode === '1234') {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});