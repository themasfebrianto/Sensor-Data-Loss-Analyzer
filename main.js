const ctx = document.getElementById('dataChart').getContext('2d');
let chart;

document.getElementById('processTextBtn').addEventListener('click', function () {
    const jsonText = document.getElementById('jsonText').value;

    try {
        const parsedJson = JSON.parse(jsonText);
        if (chart) chart.destroy();
        processSensorData(parsedJson, ctx, c => chart = c);
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

    const formatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    // Extract all keys from first valid entry
    const validEntry = axisData.find(e => typeof e?.datas === 'object');
    const dataKeys = validEntry ? Object.keys(validEntry.datas) : [];

    const dataMap = {};
    const timestamps = [];
    let lossCount = 0;

    dataKeys.forEach(key => {
        dataMap[key] = [];
    });

    axisData.forEach(entry => {
        const ts = new Date(entry.first_timestamp).toLocaleString('en-GB', formatOptions);
        timestamps.push(ts);

        let hasLoss = false;

        dataKeys.forEach(key => {
            const value = entry?.datas?.[key];
            const numericValue = typeof value === 'number' ? value : null;
            dataMap[key].push(numericValue);

            if (!numericValue || numericValue === 0) {
                hasLoss = true;
            }
        });

        if (hasLoss) {
            lossCount++;
        }
    });

    const total = axisData.length;
    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const percentLoss = ((lossCount / total) * 100).toFixed(2);
    const percentSuccess = (100 - percentLoss).toFixed(2);

    document.getElementById('resultContainer').classList.remove('d-none');
    document.getElementById('result').innerHTML = `
        <div><strong>Time Range:</strong> ${startTime} – ${endTime}</div>
        <div><strong>Total Entries:</strong> ${total}</div>
        <div><strong>Loss Entries:</strong> ${lossCount}</div>
        <div><strong>Loss Percentage:</strong> <span class="text-danger">${percentLoss}%</span></div>
        <div><strong>Success Percentage:</strong> <span class="text-success">${percentSuccess}%</span></div>
    `;

    const colorMap = {
        average_data: '#007bff',
        max_data: '#28a745',
        min_data: '#dc3545',
        standart_deviation: '#ffc107'
        // Add known keys here if you want consistent colors
    };

    function getRandomColor() {
        const r = () => Math.floor(Math.random() * 156) + 100;
        return `rgba(${r()}, ${r()}, ${r()}, 1)`;
    }

    const datasets = dataKeys.map(key => {
        const baseColor = colorMap[key] || getRandomColor();
        return {
            label: key
                .replace(/threshold_dynamic_/i, '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
            ,
            data: dataMap[key],
            borderColor: baseColor,
            backgroundColor: baseColor.replace('1)', '0.1)'),
            pointRadius: 2,
            pointBackgroundColor: key === 'average_data'
                ? dataMap[key].map(v => v === 0 ? 'red' : baseColor)
                : undefined,
            tension: 0.4,
        };
    });

    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: datasets
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

    done(newChart);
}
