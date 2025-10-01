
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import random
import datetime
import os
import sqlite3
import enchant

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change to a secure key

DB_PATH = 'people.db'
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        forename TEXT,
        surname TEXT,
        dob TEXT,
        password TEXT NOT NULL,
        email TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS wordle_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        guesses INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    conn.commit()
    conn.close()
init_db()

DICTIONARY = enchant.Dict('en_US')

# API endpoint to save daily guesses for logged-in user
@app.route('/api/save_progress', methods=['POST'])
def save_progress():
    if not session.get('username'):
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    data = request.get_json()
    guesses = data.get('guesses')
    date = data.get('date')
    if not guesses or not date:
        return jsonify({'success': False, 'error': 'Missing data'}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id FROM users WHERE username=?', (session['username'],))
    user = c.fetchone()
    if not user:
        conn.close()
        return jsonify({'success': False, 'error': 'User not found'}), 404
    user_id = user[0]
    # Save or update progress for today
    c.execute('''CREATE TABLE IF NOT EXISTS wordle_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        guesses TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    c.execute('SELECT id FROM wordle_progress WHERE user_id=? AND date=?', (user_id, date))
    existing = c.fetchone()
    if existing:
        c.execute('UPDATE wordle_progress SET guesses=? WHERE id=?', (guesses, existing[0]))
    else:
        c.execute('INSERT INTO wordle_progress (user_id, date, guesses) VALUES (?, ?, ?)', (user_id, date, guesses))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# API endpoint to load daily guesses for logged-in user
@app.route('/api/load_progress', methods=['GET'])
def load_progress():
    if not session.get('username'):
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    date = request.args.get('date')
    if not date:
        return jsonify({'success': False, 'error': 'Missing date'}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id FROM users WHERE username=?', (session['username'],))
    user = c.fetchone()
    if not user:
        conn.close()
        return jsonify({'success': False, 'error': 'User not found'}), 404
    user_id = user[0]
    c.execute('SELECT guesses FROM wordle_progress WHERE user_id=? AND date=?', (user_id, date))
    row = c.fetchone()
    conn.close()
    if row:
        return jsonify({'success': True, 'guesses': row[0]})
    else:
        return jsonify({'success': True, 'guesses': None})
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import random
import datetime
import os
import sqlite3
import enchant

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change to a secure key

DB_PATH = 'people.db'
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        forename TEXT,
        surname TEXT,
        dob TEXT,
        password TEXT NOT NULL,
        email TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS wordle_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        guesses INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    conn.commit()
    conn.close()
init_db()

DICTIONARY = enchant.Dict('en_US')

# Helper to get word of the day (5-letter for now)
def get_word_of_the_day(length=5):
    today = datetime.date.today()
    random.seed(today.toordinal())
    # Try up to 10000 times to generate a valid random 5-letter word
    for _ in range(10000):
        word = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=length))
        if DICTIONARY.check(word):
            return word
    return None

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

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        forename = request.form.get('forename')
        surname = request.form.get('surname')
        dob = request.form.get('dob')
        email = request.form.get('email')
        if not all([username, password, forename, surname, dob, email]):
            error = 'All fields are required.'
        else:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('INSERT INTO users (username, forename, surname, dob, password, email) VALUES (?, ?, ?, ?, ?, ?)',
                          (username, forename, surname, dob, password, email))
                conn.commit()
                conn.close()
                session['username'] = username
                return redirect(url_for('profile'))
            except sqlite3.IntegrityError:
                error = 'Username already exists.'
    return render_template('signup.html', error=error)

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
    # If this is a dummy request for the answer
    if guess == '_____':
        return jsonify({'answer': word})
    if not DICTIONARY.check(guess):
        return jsonify({'valid': False, 'message': 'Not a valid English word.', 'answer': word})
    result = []
    for i, letter in enumerate(guess):
        if letter == word[i]:
            result.append('green')
        elif letter in word:
            result.append('yellow')
        else:
            result.append('red')
    return jsonify({'valid': True, 'result': result, 'answer': word})

if __name__ == '__main__':
    app.run(debug=True)
