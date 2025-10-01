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
            box.addEventListener('input', onInput);
            box.addEventListener('keydown', onKeyDown);
            // Apply color if guessColors for this row exists
            if (guessColors[r] && guessColors[r][c]) {
                box.classList.add(guessColors[r][c]);
            }
            row.appendChild(box);
        }
        board.appendChild(row);
    }
    createKeyboard();
}
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

function onKeyboardClick(key) {
    if (currentRow > 5) return;
    if (keyboardState[key]) return; // Don't allow input for grayed keys
    // Find first empty box in current row
    for (let c = 0; c < 5; c++) {
        if (!guesses[currentRow][c]) {
            guesses[currentRow][c] = key;
            createBoard();
            board.querySelector(`input[data-row='${currentRow}'][data-col='${c}']`).focus();
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
        if (col < 4) {
            board.querySelector(`input[data-row='${row}'][data-col='${col+1}']`).focus();
        }
    } else {
        box.value = '';
    }
    createKeyboard(); // Update keyboard after input
}

function onKeyDown(e) {
    const box = e.target;
    const row = parseInt(box.dataset.row);
    const col = parseInt(box.dataset.col);
    if (e.key === 'Enter' && col === 4) {
        submitGuess(row);
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
                    createBoard();
                    board.querySelector(`input[data-row='${currentRow}'][data-col='0']`).focus();
                } else {
                    message.textContent = 'Out of attempts! Try again tomorrow.';
                    showLoginModal();
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

// ...existing code...
