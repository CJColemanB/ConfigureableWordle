// This JS file will fetch history data and render the table and graph
// Placeholder for AJAX fetch and rendering logic
// You will need to implement a Flask API endpoint to provide history data as JSON

// Example data format:
// const historyData = [
//   {date: '2025-09-28', word: 'flame', last_guess: 'flame', guesses: 3},
//   {date: '2025-09-29', word: 'proud', last_guess: 'proud', guesses: -1},
// ];

function renderTable(historyData) {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '';
    historyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.word}</td>
            <td>${row.last_guess}</td>
            <td${row.guesses === -1 ? ' style="color:red;"' : ''}>${row.guesses}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderGraph(historyData) {
    const ctx = document.getElementById('history-graph').getContext('2d');
    const labels = historyData.map(row => row.date);
    const data = historyData.map(row => row.guesses);
    const bgColors = historyData.map(row => row.guesses === -1 ? 'rgba(255,99,132,0.8)' : '#32cd32');
    if (window.historyChart) window.historyChart.destroy();
    window.historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Guesses Used',
                data: data,
                pointBackgroundColor: bgColors,
                borderColor: '#32cd32',
                fill: false,
                tension: 0.3,
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {display: false}
            },
            scales: {
                x: {title: {display: true, text: 'Date'}},
                y: {title: {display: true, text: 'Guesses'}, beginAtZero: true, stepSize: 1}
            }
        }
    });
}

// Placeholder: fetch and filter logic
function fetchAndRender(period = 'week', offset = 0) {
    // TODO: Fetch from Flask API endpoint
    // For now, use static data
    const historyData = [
        {date: '2025-09-28', word: 'flame', last_guess: 'flame', guesses: 3},
        {date: '2025-09-29', word: 'proud', last_guess: 'proud', guesses: -1},
        {date: '2025-09-30', word: 'apple', last_guess: 'apple', guesses: 4},
        {date: '2025-10-01', word: 'mango', last_guess: 'funny', guesses: -1}
    ];
    renderTable(historyData);
    renderGraph(historyData);
}

document.getElementById('filter-period').addEventListener('change', function() {
    fetchAndRender(this.value);
});
document.getElementById('prev-period').addEventListener('click', function() {
    // TODO: Implement offset logic
    fetchAndRender(document.getElementById('filter-period').value);
});
document.getElementById('next-period').addEventListener('click', function() {
    // TODO: Implement offset logic
    fetchAndRender(document.getElementById('filter-period').value);
});

// Initial render
fetchAndRender();
