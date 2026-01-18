import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import { t } from "i18next";
import "./styles.sass";

export const SpeedChart = ({ labels, data, dataKey, titleKey, color, onClick }) => {
    const filteredData = useMemo(() => {
        if (!data?.[dataKey] || !labels) return { labels: [], data: [], average: 0 };

        const filtered = labels.map((label, index) => ({
            label,
            value: data[dataKey][index],
            date: new Date(label)
        })).filter(item => item.value !== null && item.value !== undefined);

        const validValues = filtered.filter(item => item.value > 0).map(item => item.value);
        const average = validValues.length > 0
            ? Math.round((validValues.reduce((a, b) => a + b, 0) / validValues.length) * 100) / 100
            : 0;

        return {
            labels: filtered.map(item => item.label),
            data: filtered.map(item => item.value),
            average
        };
    }, [labels, data, dataKey]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                backgroundColor: 'hsl(215, 28%, 10%)',
                titleColor: 'hsl(210, 40%, 96%)',
                bodyColor: 'hsl(215, 20%, 65%)',
                borderColor: 'hsl(215, 25%, 22%)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10,
                displayColors: true,
                boxPadding: 8,
                callbacks: {
                    label: (item) => `${item.dataset.label}: ${item.formattedValue} ${t("latest.speed_unit")}`
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 500
                    }
                }
            }
        },
        scales: {
            x: {
                reverse: false,
                grid: {
                    color: 'hsla(215, 25%, 22%, 0.4)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: 'hsl(215, 20%, 50%)',
                    maxTicksLimit: 5,
                    callback: function(value, index) {
                        const date = new Date(filteredData.labels[index]);
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
                               date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'hsla(215, 25%, 22%, 0.4)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: 'hsl(215, 20%, 50%)',
                    stepSize: 100
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        elements: {
            line: {
                tension: 0.35,
                borderWidth: 2.5
            },
            point: {
                radius: 3,
                hoverRadius: 6,
                hoverBorderWidth: 2
            }
        }
    };

    const chartData = {
        labels: filteredData.labels,
        datasets: [
            {
                label: t(titleKey),
                data: filteredData.data,
                borderColor: color,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                    gradient.addColorStop(0, color.replace('hsl', 'hsla').replace(')', ', 0.25)'));
                    gradient.addColorStop(1, color.replace('hsl', 'hsla').replace(')', ', 0.01)'));
                    return gradient;
                },
                fill: true,
                pointBackgroundColor: color,
                pointBorderColor: color,
                order: 1
            },
            {
                label: t("statistics.average"),
                data: filteredData.labels.map(() => filteredData.average),
                borderColor: 'hsl(330, 80%, 60%)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [6, 4],
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
                order: 2
            }
        ],
    };

    return (
        <div className="chart-container" onClick={onClick}>
            <div className="chart-header">
                <h3 className="chart-title">{t(titleKey)} ({t("latest.speed_unit")})</h3>
            </div>
            <div className="chart-body">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};