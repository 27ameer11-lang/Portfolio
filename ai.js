/* ================================================ */
/* AMEER_AI — Chat Engine                           */
/* ================================================ */

'use strict';

const API_URL       = 'http://127.0.0.1:5000/api/chat';
let   backendOnline = false;
let   isSending     = false;

/* ── Demo Brain (offline fallback) ── */
const DEMO_BRAIN = [
    {
        keywords: ['hello', 'hi', 'hey', 'sup', 'yo'],
        response: 'Hey! I\'m Ameer\'s portfolio assistant. Ask me about his projects, skills, or background.'
    },
    {
        keywords: ['who', 'name', 'about', 'ameer'],
        response: 'Muhammad Ameer S is an 18-year-old certified Python developer and front-end designer. He\'s enrolling in B.Tech AI/ML at Mentor College of Engineering.'
    },
    {
        keywords: ['project', 'work', 'built', 'portfolio'],
        response: 'Current projects: AI Text Summariser (Python + Gemini API), this portfolio site (HTML/CSS/Bootstrap), with a Python Quiz App and BMI Calculator in development.'
    },
    {
        keywords: ['python', 'code', 'programming'],
        response: 'Ameer is a certified Python developer. He uses Python for AI integrations, backend APIs with Flask, and automation scripts.'
    },
    {
        keywords: ['html', 'css', 'bootstrap', 'frontend', 'website', 'web'],
        response: 'Ameer is a certified front-end web designer. He builds responsive websites using HTML, CSS, JavaScript, and Bootstrap 5.'
    },
    {
        keywords: ['college', 'study', 'education', 'degree', 'btech'],
        response: 'He completed 12th State Board and is enrolling in B.Tech AI/ML at Mentor College of Engineering.'
    },
    {
        keywords: ['contact', 'email', 'reach', 'hire'],
        response: 'You can reach Ameer at 27ameer11@gmail.com or through the contact page on this site.'
    },
    {
        keywords: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'gemini'],
        response: 'Ameer focuses on AI applications. This chat and the AI Summariser both use the Gemini API. He\'s building his ML skills through his B.Tech programme.'
    },
    {
        keywords: ['skill', 'stack', 'technology', 'tools', 'know'],
        response: 'Stack: Python, HTML, CSS, JavaScript, Bootstrap 5, Flask, Gemini API. Certified in Python development and front-end web design.'
    },
    {
        keywords: ['summariser', 'summarizer', 'summary'],
        response: 'The AI Text Summariser lets you paste any text and get an instant summary. It uses the Gemini API with options for short, medium, or detailed output.'
    }
];

function getDemoReply(message) {
    const lower = message.toLowerCase();
    for (const item of DEMO_BRAIN) {
        if (item.keywords.some(k => lower.includes(k))) {
            return item.response;
        }
    }
    return 'Good question. Try asking about Ameer\'s projects, skills, education, or how to contact him.';
}

/* ── UI Functions ── */
function toggleChat() {
    const win = document.getElementById('aiChatWindow');
    if (!win) return;
    win.classList.toggle('active');
    if (win.classList.contains('active')) {
        const input = document.getElementById('chatInput');
        if (input) setTimeout(() => input.focus(), 300);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addMessage(text, sender) {
    const body = document.getElementById('chatBody');
    if (!body) return;

    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-message' : 'ai-message';

    if (sender === 'ai') {
        const safe = escapeHtml(text);
        div.innerHTML = `<p><strong>ai:</strong> ${safe}</p>`;
    } else {
        div.innerHTML = `<p>${escapeHtml(text)}</p>`;
    }

    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function showThinking() {
    removeThinking();
    const body = document.getElementById('chatBody');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'ai-message';
    div.id = 'ai-thinking';
    div.innerHTML = '<p><strong>ai:</strong> thinking<span class="dot-blink">...</span></p>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function removeThinking() {
    const el = document.getElementById('ai-thinking');
    if (el) el.remove();
}

/* ── Backend Check ── */
async function checkBackend() {
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(API_URL, { method: 'HEAD', signal: ctrl.signal });
        clearTimeout(t);
        backendOnline = res.ok;
    } catch {
        backendOnline = false;
    }
}

/* ── Send Message ── */
async function sendMessage() {
    if (isSending) return;
    const input = document.getElementById('chatInput');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;

    isSending = true;
    addMessage(msg, 'user');
    input.value = '';
    showThinking();

    if (!backendOnline) {
        setTimeout(() => {
            removeThinking();
            addMessage(getDemoReply(msg), 'ai');
            isSending = false;
        }, 600);
        return;
    }

    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg }),
            signal: ctrl.signal
        });
        clearTimeout(t);

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        removeThinking();
        addMessage(data.reply || 'No response.', 'ai');

    } catch (err) {
        removeThinking();
        backendOnline = false;
        addMessage(getDemoReply(msg), 'ai');
    } finally {
        isSending = false;
    }
}

/* ── Init ── */
window.addEventListener('DOMContentLoaded', () => {
    checkBackend();
    setInterval(checkBackend, 30000);
});