# 📊 Sensor Data Loss Analyzer

A modern, client-side web tool for visualizing and analyzing data loss from multi-axis sensor logs (e.g., accelerometer, gyroscope). Built with vanilla JavaScript and Chart.js.

---

## 🔍 Features

- Paste your structured JSON sensor data and visualize average readings.
- Calculates:
  - Total data points
  - Lost data points (based on zero or null stats)
  - Success and loss percentages
  - Time range of the dataset
- Interactive line chart with color-coded anomalies.
- No backend — all processing is done in the browser.

---

## 📁 Sample Input Format

```json
{
  "data": [
    {
      "type": "x",
      "datas": [
        {
          "first_timestamp": "2024-01-01T00:00:00Z",
          "datas": {
            "average_data": 0.5,
            "min_data": 0.1,
            "max_data": 0.9,
            "standart_deviation": 0.2
          }
        }
      ]
    }
  ]
}
