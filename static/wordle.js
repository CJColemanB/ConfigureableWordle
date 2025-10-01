const board = document.getElementById('wordle-board');
const message = document.getElementById('message');
let keyboardState = {};
const keyboardLayout = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
];
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    board.querySelector(`input[data-row='0'][data-col='0']`).focus();
});
let currentRow = 0;
let currentCol = 0;
let guesses = Array(6).fill('').map(() => Array(5).fill(''));

// Store colors for each guess row
let guessColors = Array(6).fill(null);

function createBoard() {
    board.innerHTML = '';
    for (let r = 0; r < 6; r++) {
        const row = document.createElement('div');
        row.className = 'wordle-row';
        for (let c = 0; c < 5; c++) {
            const box = document.createElement('input');
            box.type = 'text';
            box.maxLength = 1;
            box.className = 'wordle-box';
            box.dataset.row = r;
            box.dataset.col = c;
            box.value = guesses[r][c];
            box.readOnly = r !== currentRow;
            if (r === currentRow) {
                box.tabIndex = 0;
            } else {
                box.tabIndex = -1;
            }
            box.addEventListener('input', onInput);
            box.addEventListener('keydown', onKeyDown);
            // Apply color if guessColors for this row exists
            if (guessColors[r] && guessColors[r][c]) {
                box.classList.add(guessColors[r][c]);
            }
            row.appendChild(box);
        }
        // ...no submit button, only Enter key for submission...
        board.appendChild(row);
    }
    createKeyboard();
}

    // Restore focus to the correct box in current row
    setTimeout(() => {
        // Find next empty box in current row, or last filled
        let focusCol = 0;
        for (let c = 0; c < 5; c++) {
            if (!guesses[currentRow][c]) {
                focusCol = c;
                break;
            }
            if (c === 4) focusCol = 4;
        }
        const input = board.querySelector(`input[data-row='${currentRow}'][data-col='${focusCol}']`);
        if (input) input.focus();
    }, 0);

function createKeyboard() {
    const keyboardDiv = document.getElementById('wordle-keyboard');
    keyboardDiv.innerHTML = '';
    keyboardLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'keyboard-key';
            keyDiv.textContent = key;
            if (keyboardState[key]) {
                keyDiv.classList.add('gray');
            }
            keyDiv.addEventListener('click', () => onKeyboardClick(key));
            rowDiv.appendChild(keyDiv);
        });
        keyboardDiv.appendChild(rowDiv);
    });
}

for (let c = 0; c < 5; c++) {
    if (!guesses[currentRow][c]) {
        guesses[currentRow][c] = key;
        currentCol = c < 4 ? c + 1 : 4;
        createBoard();
        // ...rest of your logic...
        break;
    }
}

function onKeyboardClick(key) {
    if (currentRow > 5) return;
    if (keyboardState[key]) return; // Don't allow input for grayed keys
    // Find first empty box in current row
    for (let c = 0; c < 5; c++) {
        if (!guesses[currentRow][c]) {
            guesses[currentRow][c] = key;
            createBoard();
            // Focus next box if available
            if (c < 4) {
                board.querySelector(`input[data-row='${currentRow}'][data-col='${c+1}']`).focus();
            } else {
                // If last box filled, check if all boxes are filled, then submit
                if (guesses[currentRow].every(l => /^[A-Z]$/.test(l))) {
                    submitGuess(currentRow);
                }
            }
            saveProgress();
            break;
        }
    }
}

function onInput(e) {
    const box = e.target;
    const row = parseInt(box.dataset.row);
    const col = parseInt(box.dataset.col);
    const val = box.value.toUpperCase();
        if (/^[A-Z]$/.test(val)) {
            guesses[row][col] = val;
            currentCol = col < 4 ? col + 1 : 4;
            // Auto-advance focus to next box if not last
            if (col < 4) {
                board.querySelector(`input[data-row='${row}'][data-col='${col+1}']`).focus();
            }
            // Do NOT auto-submit when last box is filled
        } else {
            box.value = '';
        }
        createKeyboard(); // Update keyboard after input
        saveProgress();
}

function onKeyDown(e) {
    const box = e.target;
    const row = parseInt(box.dataset.row);
    const col = parseInt(box.dataset.col);
    if (e.key === 'Enter') {
        // Only submit if all boxes in the row are filled
        if (guesses[row].every(l => /^[A-Z]$/.test(l))) {
            submitGuess(row);
        }
    } else if (e.key === 'Backspace' && col > 0 && box.value === '') {
        board.querySelector(`input[data-row='${row}'][data-col='${col-1}']`).focus();
    }
}

function submitGuess(row) {
    const guess = guesses[row].join('').toLowerCase();
    if (guess.length !== 5) {
        message.textContent = 'Enter a 5-letter word.';
        return;
    }
    fetch('/check_word', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({guess})
    })
    .then(res => res.json())
    .then(data => {
        if (!data.valid) {
            message.textContent = data.message;
            return;
        }
        message.textContent = '';
        const rowBoxes = board.querySelectorAll(`.wordle-row:nth-child(${row+1}) .wordle-box`);
        // Animate coloring each box one by one
        guessColors[row] = Array(5).fill(null); // Prepare to store colors for this row
        function animateBox(i) {
            if (i >= data.result.length) {
                // After animation, update keyboard for grayed out letters
                updateKeyboardState(row, guesses[row], data.result);
                createKeyboard();
                // After animation, check win/lose and move to next row
                if (data.result.every(c => c === 'green')) {
                    message.textContent = 'Congratulations! You guessed the word!';
                    showLoginModal();
                } else if (row < 5) {
                    currentRow++;
                    currentCol = 0;
                    createBoard();
                    setTimeout(() => {
                        const input = board.querySelector(`input[data-row='${currentRow}'][data-col='0']`);
                        if (input) input.focus();
                    }, 0);
                } else {
                    // Reveal the correct answer after all attempts
                    fetch('/check_word', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({guess: '_____'}), // dummy guess to get the answer
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.answer) {
                            message.textContent = `Out of attempts! The correct word was: ${data.answer}`;
                        } else {
                            message.textContent = 'Out of attempts! Try again tomorrow.';
                        }
                        showLoginModal();
                    })
                    .catch(() => {
                        message.textContent = 'Out of attempts! Try again tomorrow.';
                        showLoginModal();
                    });
                }
function showLoginModal() {
    let modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Save Your Wordle History!</h2>
            <p>Login or sign up to save your guessing history and track your stats.</p>
            <div class="modal-actions">
                <button id="modal-login-btn" class="btn">Login / Sign Up</button>
                <button id="modal-no-btn" class="btn alt">No Thanks</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('modal-login-btn').onclick = () => {
        window.location.href = '/profile';
    };
    document.getElementById('modal-no-btn').onclick = () => {
        modal.remove();
    };
}
function addLoginButtonListener() {
    const btn = document.getElementById('login-btn');
    if (btn) {
        btn.onclick = () => {
            window.location.href = '/profile';
        };
    }
}
                return;
            }
            rowBoxes[i].classList.add(data.result[i]);
            rowBoxes[i].style.transition = 'background 0.3s, border 0.3s';
            guessColors[row][i] = data.result[i]; // Store color for this box
            setTimeout(() => animateBox(i+1), 350);
        }
        animateBox(0);

// Update keyboardState for grayed out letters
function updateKeyboardState(row, guessArr, colorArr) {
    for (let i = 0; i < guessArr.length; i++) {
        const letter = guessArr[i];
        if (colorArr[i] === 'red') {
            keyboardState[letter] = true;
        }
    }
}
    });
}
// Utility to get today's date in YYYY-MM-DD format
function getTodayDate() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

// Save guesses to server for logged-in user
function saveProgress() {
    fetch('/api/save_progress', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            date: getTodayDate(),
            guesses: JSON.stringify(guesses)
        })
    });
}

// Load guesses from server for logged-in user
function loadProgress() {
    fetch(`/api/load_progress?date=${getTodayDate()}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.guesses) {
                const loaded = JSON.parse(data.guesses);
                if (Array.isArray(loaded) && loaded.length === 6) {
                    guesses = loaded;
                    createBoard();
                }
    createKeyboard();
    saveProgress();
            }
});
}
