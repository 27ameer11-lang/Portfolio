"""
Portfolio Backend — Flask + Gemini API
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # allow all origins

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=GEMINI_API_KEY)

CHAT_PROMPT = """
You are a helpful assistant for Muhammad Ameer S's developer portfolio.

KEY FACTS:
- Muhammad Ameer S is an 18-year-old from India.
- Completed 12th State Board. Enrolling in B.Tech AI/ML at Mentor College of Engineering.
- Certified Python Developer and certified Front-End Web Designer.
- Tech stack: Python, HTML, CSS, JavaScript, Bootstrap 5.
- Focus: AI applications and web development.
- Portfolio projects: AI Text Summariser, Developer Portfolio, Python Quiz App, BMI Calculator.
- Contact: 27ameer11@gmail.com

RULES:
- Keep replies concise (2-3 sentences max).
- Be friendly and professional.
- If asked something outside scope, politely redirect.
""".strip()


@app.route('/api/chat', methods=['HEAD'])
def chat_health():
    return '', 200


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        msg = data.get("message", "").strip()

        if not msg:
            return jsonify({"error": "Empty message"}), 400
        if len(msg) > 500:
            return jsonify({"error": "Too long"}), 400

        log.info(f"Chat: {msg[:60]}")

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f"{CHAT_PROMPT}\n\nUser: {msg}"
        )

        reply = response.text.strip() if response.text else ""
        return jsonify({"reply": reply or "No response generated."})

    except Exception as e:
        log.error(f"Chat error: {e}")
        return jsonify({"reply": "Something went wrong. Try again."}), 500


@app.route('/api/summarise', methods=['POST'])
def summarise():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "").strip()
        length = data.get("length", "short").lower()

        log.info(f"Summarise request received — length: {length}, chars: {len(text)}")

        if not text:
            return jsonify({"error": "No text provided"}), 400
        if len(text) > 10000:
            return jsonify({"error": "Text too long"}), 400

        length_map = {
            "short":    "Summarise in 1-2 sentences only. Be extremely concise.",
            "medium":   "Summarise in 3-5 sentences. Cover the main points clearly.",
            "detailed": "Write a detailed summary in 6-10 sentences covering all key points."
        }

        instruction = length_map.get(length, length_map["short"])

        prompt = f"{instruction}\n\nText to summarise:\n{text}\n\nProvide only the summary."

        log.info(f"Sending to Gemini...")

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )

        summary = response.text.strip() if response.text else ""

        log.info(f"Gemini responded — {len(summary)} chars")

        if not summary:
            return jsonify({"error": "AI returned empty response"}), 500

        return jsonify({"summary": summary})

    except Exception as e:
        log.error(f"Summarise error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"status": "ok", "message": "Backend is running"})


if __name__ == '__main__':
    log.info("Server starting on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)