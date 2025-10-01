from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import random
import datetime
import os
import sqlite3
import enchant

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change to a secure key

# Initialize SQLite DB for users
DB_PATH = 'people.db'
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )''')
    conn.commit()
    conn.close()
init_db()

DICTIONARY = enchant.Dict('en_US')

# Helper to get word of the day (5-letter for now)
def get_word_of_the_day(length=5):
    # For now, generate random 5-letter word from all possible combinations
    # In future, you can expand to other lengths
    # This is a simple way to get a valid word
    # You may want to cache or optimize for performance
    possible = []
    # Use a simple word list for now, but you can expand
    with open('static/wordlist.txt') as f:
        for line in f:
            w = line.strip().lower()
            if len(w) == length and DICTIONARY.check(w):
                possible.append(w)
    today = datetime.date.today()
    random.seed(today.toordinal())
    return random.choice(possible) if possible else None

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/daily')
def daily():
    return render_template('daily.html')

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    error = None
    if request.method == 'POST':
        action = request.form.get('action')
        username = request.form.get('username')
        password = request.form.get('password')
        if action == 'register':
            if not username or not password:
                error = 'Username and password required.'
            else:
                try:
                    conn = sqlite3.connect(DB_PATH)
                    c = conn.cursor()
                    c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
                    conn.commit()
                    conn.close()
                    session['username'] = username
                    return redirect(url_for('profile'))
                except sqlite3.IntegrityError:
                    error = 'Username already exists.'
        elif action == 'login':
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE username=? AND password=?', (username, password))
            user = c.fetchone()
            conn.close()
            if user:
                session['username'] = username
                return redirect(url_for('profile'))
            else:
                error = 'Invalid username or password.'
    return render_template('profile.html', username=session.get('username'), error=error)
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
    if not DICTIONARY.check(guess):
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
