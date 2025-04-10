document.getElementById('processTextBtn').addEventListener('click', function () {
    const jsonText = document.getElementById('jsonText').value;

    try {
        const parsedJson = JSON.parse(jsonText);
        processSensorData(parsedJson);
    } catch (err) {
        document.getElementById('result').innerHTML = `<span class="text-danger">Invalid JSON: ${err.message}</span>`;
        document.getElementById('resultContainer').classList.add('d-none');
    }
});

function processSensorData(json) {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = ''; // Clear old charts
    const allAxes = json?.data;
    if (!Array.isArray(allAxes) || allAxes.length === 0) {
        document.getElementById('result').innerHTML = `<span class="text-warning">No valid sensor data found.</span>`;
        document.getElementById('resultContainer').classList.add('d-none');
        return;
    }

    const formatOptions = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    };

    const colorMap = {
        average_data: '#007bff',
        max_data: '#28a745',
        min_data: '#dc3545',
        standart_deviation: '#ffc107'
    };

    function getRandomColor() {
        const r = () => Math.floor(Math.random() * 156) + 100;
        return `rgba(${r()}, ${r()}, ${r()}, 1)`;
    }

    let total = 0;
    let lossCount = 0;
    let globalStart, globalEnd;

    allAxes.forEach((axis, i) => {
        const axisLabel = axis?.type || `Axis ${i + 1}`;
        const entries = axis?.datas;
        if (!Array.isArray(entries)) return;

        entries.sort((a, b) => new Date(a.first_timestamp) - new Date(b.first_timestamp));

        const validEntry = entries.find(e => typeof e?.datas === 'object');
        const keys = validEntry ? Object.keys(validEntry.datas) : [];
        const dataMap = {};
        const timestamps = [];

        keys.forEach(k => dataMap[k] = []);

        entries.forEach(entry => {
            const ts = new Date(entry.first_timestamp).toLocaleString('en-GB', formatOptions);
            timestamps.push(ts);

            if (!globalStart || new Date(entry.first_timestamp) < new Date(globalStart)) {
                globalStart = entry.first_timestamp;
            }
            if (!globalEnd || new Date(entry.first_timestamp) > new Date(globalEnd)) {
                globalEnd = entry.first_timestamp;
            }

            let hasLoss = false;
            keys.forEach(key => {
                const val = entry.datas?.[key];
                const num = typeof val === 'number' ? val : null;
                dataMap[key].push(num);
                if (!num || num === 0) hasLoss = true;
            });

            if (hasLoss) lossCount++;
            total++;
        });

        // Create canvas dynamically
        const chartWrapper = document.createElement('div');
        chartWrapper.style.height = '500px'; // Adjust height as needed
        chartWrapper.classList.add('mb-4');  // Bootstrap spacing

        const canvas = document.createElement('canvas');
        canvas.id = `chart-${i}`;
        chartWrapper.appendChild(canvas);
        container.appendChild(chartWrapper);

        const ctx = canvas.getContext('2d');


        const datasets = keys.map(key => {
            const color = colorMap[key] || getRandomColor();
            return {
                label: key
                    .replace(/threshold_dynamic_/i, '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase()),
                data: dataMap[key],
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                pointRadius: 2,
                pointBackgroundColor: key === 'average_data'
                    ? dataMap[key].map(v => v === 0 ? 'red' : color)
                    : undefined,
                tension: 0.4
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Sensor Axis: ${axisLabel.toUpperCase()}`,
                        padding: { top: 10, bottom: 10 },
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 10, boxWidth: 12 }
                    },
                    tooltip: { mode: 'index', intersect: false }
                },
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
                }
            }
        });
    });

    const percentLoss = ((lossCount / total) * 100).toFixed(2);
    const percentSuccess = (100 - percentLoss).toFixed(2);

    const startTime = new Date(globalStart).toLocaleString('en-GB', formatOptions);
    const endTime = new Date(globalEnd).toLocaleString('en-GB', formatOptions);

    document.getElementById('resultContainer').classList.remove('d-none');
    document.getElementById('result').innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; flex-wrap: wrap; ">
      <div><strong>Time Range:</strong> ${startTime} – ${endTime}</div>
      <div><strong>Total Entries:</strong> ${total}</div>
      <div><strong>Loss Entries:</strong> ${lossCount}</div>
      <div><strong>Loss Percentage:</strong> <span class="text-danger">${percentLoss}%</span></div>
      <div><strong>Success Percentage:</strong> <span class="text-success">${percentSuccess}%</span></div>
    </div>
  `;
}
