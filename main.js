const ctx = document.getElementById('dataChart').getContext('2d');
let chart;
const sensorData = processSensorData;

document.getElementById('processTextBtn').addEventListener('click', function () {
    const jsonText = document.getElementById('jsonText').value;

    try {
        const parsedJson = JSON.parse(jsonText);
        if (chart) chart.destroy();
        sensorData(parsedJson, ctx, c => chart = c);
    } catch (err) {
        document.getElementById('result').innerHTML = `<span class="text-danger">Invalid JSON: ${err.message}</span>`;
        document.getElementById('resultContainer').classList.add('d-none');
    }
});

function processSensorData(json, ctx, done) {
    const firstAxis = json?.data?.[0];
    const axisLabel = firstAxis?.type ?? 'Unknown';
    const axisData = firstAxis?.datas;

    if (!Array.isArray(axisData)) {
        document.getElementById('result').innerHTML = `<span class="text-warning">No valid sensor data found.</span>`;
        document.getElementById('resultContainer').classList.add('d-none');
        return;
    }

    axisData.sort((a, b) => new Date(a.first_timestamp) - new Date(b.first_timestamp));

    let total = axisData.length;
    let lossCount = 0;

    const timestamps = [];
    const values = [];
    const formatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    axisData.forEach(entry => {
        const ts = new Date(entry.first_timestamp).toLocaleString('en-GB', formatOptions);
        const val = entry.datas.average_data;

        timestamps.push(ts);
        values.push(val);

        if (
            val === 0 ||
            entry.datas.max_data === 0 ||
            entry.datas.min_data === 0 ||
            entry.datas.standart_deviation === 0
        ) {
            lossCount++;
        }
    });

    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const percentLoss = ((lossCount / total) * 100).toFixed(2);
    const percentSuccess = (100 - percentLoss).toFixed(2);

    document.getElementById('resultContainer').classList.remove('d-none'); // Show container

    document.getElementById('result').innerHTML = `
<div><strong>Time Range:</strong> ${startTime} – ${endTime}</div>
<div><strong>Total Entries:</strong> ${total}</div>
<div><strong>Loss Entries:</strong> ${lossCount}</div>
<div><strong>Loss Percentage:</strong><span class="danger-text"> ${percentLoss}%</span></div>
<div><strong>Success Percentage:</strong> <span class="success-text">${percentSuccess}%</span></div>
`;

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: `Average Data (${axisLabel}-axis)`,
                data: values,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                pointRadius: 3,
                pointBackgroundColor: values.map(v => v === 0 ? 'red' : '#007bff'),
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20,
                    }
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { display: true },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });

    done(chart);
}