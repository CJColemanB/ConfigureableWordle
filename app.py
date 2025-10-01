from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import random
import datetime
import os
import enchant

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change to a secure key

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
