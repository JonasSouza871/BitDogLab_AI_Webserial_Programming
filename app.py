"""
Backend proxy - esconde a API key do Groq
A key fica nos Secrets do HuggingFace (invisivel pro usuario)
"""
import os
import requests
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

API_KEY = os.environ.get('GROQ_API_KEY', '')
API_URL = 'https://api.groq.com/openai/v1/chat/completions'
MODEL = os.environ.get('AI_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    if not API_KEY:
        return jsonify({'error': 'API key nao configurada'}), 500

    data = request.get_json()
    messages = data.get('messages', [])

    try:
        resp = requests.post(API_URL, json={
            'model': MODEL,
            'messages': messages
        }, headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        }, timeout=30)

        return jsonify(resp.json()), resp.status_code

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
