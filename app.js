let lessonsData = [];
let currentLessonId = null;

const dashboardView = document.getElementById('dashboard-view');
const lessonDetailView = document.getElementById('lesson-detail-view');
const lessonList = document.getElementById('lesson-list');
const backBtn = document.getElementById('back-btn');

const lessonTitle = document.getElementById('lesson-title');
const lessonRequirements = document.getElementById('lesson-requirements');
const lessonReading = document.getElementById('lesson-reading');
const lessonVideoContainer = document.getElementById('lesson-video-container');
const callLessonBtn = document.getElementById('call-lesson-btn');

const submissionForm = document.getElementById('submission-form');
const studentNameInput = document.getElementById('student-name');
const q1Text = document.getElementById('q1-text');
const q2Text = document.getElementById('q2-text');
const answer1Input = document.getElementById('answer1');
const answer2Input = document.getElementById('answer2');
const formStatus = document.getElementById('form-status');

// Teacher Elements
const teacherBtn = document.getElementById('teacher-btn');
const teacherModal = document.getElementById('teacher-modal');
const passcodeInput = document.getElementById('passcode-input');
const submitPasscodeBtn = document.getElementById('submit-passcode-btn');
const cancelPasscodeBtn = document.getElementById('cancel-passcode-btn');
const passcodeError = document.getElementById('passcode-error');
const teacherView = document.getElementById('teacher-view');
const backToDashBtn = document.getElementById('back-to-dash-btn');
const submissionsList = document.getElementById('submissions-list');

// Fetch Master Dashboard Lessons on Load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/lessons');
        lessonsData = await response.json();
        renderLessons();
    } catch (err) {
        console.error('Failed to load lessons:', err);
        lessonList.innerHTML = '<p style="color:red;">Failed to load lessons data from server.</p>';
    }
});

function renderLessons() {
    if (!lessonsData || lessonsData.length === 0) {
        lessonList.innerHTML = '<p>No lessons available.</p>';
        return;
    }

    const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');

    lessonList.innerHTML = lessonsData.map(lesson => {
        const isCompleted = completedLessons.includes(lesson.id);
        return `
            <div class="lesson-card ${isCompleted ? 'completed' : ''}" onclick="openLesson(${lesson.id})">
                <h3>Lesson ${lesson.id}: ${lesson.title} ${isCompleted ? '✓' : ''}</h3>
                <p>Click to open reading materials, watch video, and answer questions.</p>
            </div>
        `;
    }).join('');
}

window.openLesson = function(id) {
    const lesson = lessonsData.find(l => l.id === id);
    if (!lesson) return;

    currentLessonId = id;
    dashboardView.classList.remove('active');
    teacherView.classList.remove('active');
    lessonDetailView.classList.add('active');

    // Populate detail fields from master dashboard overview data
    lessonTitle.textContent = `Lesson ${lesson.id}: ${lesson.title}`;
    lessonRequirements.textContent = lesson.requirements || (lesson.content && lesson.content.overview) || "Read materials, watch video, and complete reflection questions.";
    lessonReading.textContent = lesson.reading || "See syllabus / assigned texts.";
    
    if (lesson.videoUrl) {
        lessonVideoContainer.innerHTML = `
            <div class="video-container">
                <iframe src="${lesson.videoUrl}" allowfullscreen></iframe>
            </div>`;
    } else {
        lessonVideoContainer.innerHTML = `<p style="color: var(--text-muted);">Video reference not linked.</p>`;
    }

    // Populate reflection questions properly from JSON array
    q1Text.textContent = `1. ${lesson.questions && lesson.questions[0] ? lesson.questions[0] : "Reflection Question 1"}`;
    q2Text.textContent = `2. ${lesson.questions && lesson.questions[1] ? lesson.questions[1] : "Reflection Question 2"}`;
    
    answer1Input.value = '';
    answer2Input.value = '';
    formStatus.textContent = '';
};

// "Call Lesson" button action: fetches the granular individual file (lesson1.json, lesson2.json, etc.) and opens it in a separate window
if (callLessonBtn) {
    callLessonBtn.addEventListener('click', async () => {
        if (!currentLessonId) return;

        try {
            const response = await fetch(`/api/lesson/${currentLessonId}`);
            if (!response.ok) {
                throw new Error(`Failed to load individual file for Lesson ${currentLessonId}`);
            }
            const lesson = await response.json();

            const newWindow = window.open('', '_blank', 'width=850,height=750');
            
            let htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Lesson ${lesson.id}: ${lesson.title}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; line-height: 1.6; color: #1f2937; background: #f0fdf4; max-width: 800px; margin: 0 auto; }
                        h1 { color: #0d9488; border-bottom: 2px solid #ccfbf1; padding-bottom: 10px; margin-bottom: 20px; }
                        h3 { color: #0d9488; margin-top: 25px; margin-bottom: 10px; }
                        .card { background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                        ul { margin-left: 20px; margin-bottom: 15px; }
                        li { margin-bottom: 6px; }
                        p { margin-bottom: 12px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Lesson ${lesson.id}: ${lesson.title}</h1>
                        <p><strong>Overview:</strong> ${lesson.requirements || (lesson.content && lesson.content.overview) || ''}</p>
            `;

            // Render sections dynamically from the individual lesson JSON file
            if (lesson.sections && lesson.sections.length > 0) {
                lesson.sections.forEach(sec => {
                    htmlContent += `<h3>${sec.title}</h3>`;
                    if (sec.content) htmlContent += `<p>${sec.content}</p>`;
                    
                    if (sec.stages) {
                        htmlContent += `<ul>`;
                        sec.stages.forEach(st => htmlContent += `<li><strong>${st.stage}:</strong> ${st.description}</li>`);
                        htmlContent += `</ul>`;
                    }
                    if (sec.points) {
                        htmlContent += `<ul>`;
                        sec.points.forEach(pt => {
                            if (typeof pt === 'object' && pt.author) {
                                htmlContent += `<li><strong>${pt.author}:</strong> &ldquo;${pt.quote}&rdquo;</li>`;
                            } else {
                                htmlContent += `<li>${pt}</li>`;
                            }
                        });
                        htmlContent += `</ul>`;
                    }
                    if (sec.aspects) {
                        htmlContent += `<ul>`;
                        sec.aspects.forEach(asp => htmlContent += `<li><strong>${asp.aspect}:</strong> ${asp.description}</li>`);
                        htmlContent += `</ul>`;
                    }
                });
            }

            // Render Catechism Reading if present
            if (lesson.catechism_reading) {
                htmlContent += `<h3>📖 ${lesson.catechism_reading.title}</h3>`;
                htmlContent += `<p>${lesson.catechism_reading.description}</p><ul>`;
                lesson.catechism_reading.readings.forEach(r => htmlContent += `<li><strong>${r.citation}:</strong> ${r.summary}</li>`);
                htmlContent += `</ul>`;
            }

            // Render Scriptural Foundations if present
            if (lesson.scriptural_foundations && lesson.scriptural_foundations.length > 0) {
                htmlContent += `<h3>📖 Scriptural Foundations</h3><ul>`;
                lesson.scriptural_foundations.forEach(sf => htmlContent += `<li><strong>${sf.reference} (${sf.title}):</strong> ${sf.summary}</li>`);
                htmlContent += `</ul>`;
            }

            htmlContent += `
                    </div>
                </body>
                </html>
            `;

            newWindow.document.write(htmlContent);
            newWindow.document.close();

        } catch (err) {
            console.error("Error calling lesson detail file:", err);
            alert("Could not load the detailed lesson file from the server.");
        }
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        lessonDetailView.classList.remove('active');
        dashboardView.classList.add('active');
        renderLessons();
    });
}

// Handle Form Submission
if (submissionForm) {
    submissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formStatus.textContent = 'Submitting responses...';
        formStatus.style.color = 'var(--text-main)';

        const payload = {
            lessonId: currentLessonId,
            userName: studentNameInput.value.trim(),
            answers: {
                question1: q1Text.textContent,
                answer1: answer1Input.value.trim(),
                question2: q2Text.textContent,
                answer2: answer2Input.value.trim()
            }
        };

        try {
            const res = await fetch('/api/submit-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                formStatus.textContent = result.message;
                formStatus.style.color = '#10b981';
                
                let completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
                if (!completedLessons.includes(currentLessonId)) {
                    completedLessons.push(currentLessonId);
                    localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
                }

                submissionForm.reset();
            } else {
                formStatus.textContent = 'Error submitting responses.';
                formStatus.style.color = '#ef4444';
            }
        } catch (err) {
            formStatus.textContent = 'Network error during submission.';
            formStatus.style.color = '#ef4444';
        }
    });
}

// Teacher Modal Actions
if (teacherBtn) {
    teacherBtn.addEventListener('click', () => {
        passcodeInput.value = '';
        passcodeError.style.display = 'none';
        teacherModal.style.display = 'flex';
    });
}

if (cancelPasscodeBtn) {
    cancelPasscodeBtn.addEventListener('click', () => {
        teacherModal.style.display = 'none';
    });
}

if (submitPasscodeBtn) {
    submitPasscodeBtn.addEventListener('click', async () => {
        const passcode = passcodeInput.value;

        try {
            const response = await fetch('/api/teacher-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
            });
            const result = await response.json();

            if (result.success) {
                teacherModal.style.display = 'none';
                dashboardView.classList.remove('active');
                lessonDetailView.classList.remove('active');
                teacherView.classList.add('active');

                loadSubmissions();
            } else {
                passcodeError.textContent = 'Incorrect passcode. Try again.';
                passcodeError.style.display = 'block';
            }
        } catch (err) {
            passcodeError.textContent = 'Server error verifying passcode.';
            passcodeError.style.display = 'block';
        }
    });
}

async function loadSubmissions() {
    try {
        const res = await fetch('/api/submissions');
        const subs = await res.json();
        
        if (subs.length === 0) {
            submissionsList.innerHTML = '<p>No student submissions received yet.</p>';
            return;
        }

        submissionsList.innerHTML = subs.map(sub => `
            <div class="submission-card">
                <h3 style="margin-top: 0; color: var(--primary);">Lesson ${sub.lessonId} — Student: ${sub.userName}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);"><strong>Submitted on:</strong> ${sub.date}</p>
                <hr style="border: 0; border-top: 1px solid var(--border); margin: 10px 0;">
                <p><strong>${sub.answers.question1}</strong><br>${sub.answers.answer1}</p>
                <br>
                <p><strong>${sub.answers.question2}</strong><br>${sub.answers.answer2}</p>
            </div>
        `).join('');
    } catch (err) {
        submissionsList.innerHTML = '<p style="color: #ef4444;">Failed to load submissions.</p>';
    }
}

if (backToDashBtn) {
    backToDashBtn.addEventListener('click', () => {
        teacherView.classList.remove('active');
        dashboardView.classList.add('active');
        renderLessons();
    });
}