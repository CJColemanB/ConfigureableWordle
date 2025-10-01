from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import random
import datetime
import os
import nltk
from nltk.corpus import words

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change to a secure key

# Ensure nltk words corpus is downloaded
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

# Get all 5-letter English words
WORDS = set(w.lower() for w in words.words() if len(w) == 5 and w.isalpha())

# Helper to get word of the day
def get_word_of_the_day():
    today = datetime.date.today()
    random.seed(today.toordinal())
    return random.choice(list(WORDS))

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/daily')
def daily():
    return render_template('daily.html')

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if request.method == 'POST':
        username = request.form.get('username')
        if username:
            session['username'] = username
            return redirect(url_for('profile'))
    return render_template('profile.html', username=session.get('username'))
@app.route('/history')
def history():
    if not session.get('username'):
        return redirect(url_for('profile'))
    # Placeholder: show history for logged-in user
    return render_template('history.html', username=session.get('username'))

@app.route('/check_word', methods=['POST'])
def check_word():
    data = request.get_json()
    guess = data.get('guess', '').lower()
    word = get_word_of_the_day()
    if guess not in WORDS:
        return jsonify({'valid': False, 'message': 'Not a valid English word.'})
    result = []
    for i, letter in enumerate(guess):
        if letter == word[i]:
            result.append('green')
        elif letter in word:
            result.append('yellow')
        else:
            result.append('red')
    return jsonify({'valid': True, 'result': result})

if __name__ == '__main__':
    app.run(debug=True)
