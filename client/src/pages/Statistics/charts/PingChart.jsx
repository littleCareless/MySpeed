import { Line } from "react-chartjs-2";
import { useMemo, useContext } from "react";
import { t } from "i18next";
import { ThemeContext } from "@/common/contexts/Theme";
import "./SpeedChart/styles.sass";

const PingChart = (props) => {
    const [isDarkMode] = useContext(ThemeContext);

    const filteredData = useMemo(() => {
        if (!props.data?.ping || !props.labels) return { labels: [], data: [], average: 0 };

        const filtered = props.labels.map((label, index) => ({
            label,
            value: props.data.ping[index],
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
    }, [props.labels, props.data]);

    const gridColor = isDarkMode ? 'rgba(42, 52, 65, 0.6)' : 'rgba(203, 213, 225, 0.8)';
    const tickColor = isDarkMode ? 'hsl(215, 20%, 50%)' : 'hsl(215, 25%, 40%)';
    const tooltipBg = isDarkMode ? 'hsl(215, 28%, 10%)' : 'hsl(0, 0%, 100%)';
    const tooltipTitle = isDarkMode ? 'hsl(210, 40%, 96%)' : 'hsl(215, 25%, 20%)';
    const tooltipBody = isDarkMode ? 'hsl(215, 20%, 65%)' : 'hsl(215, 15%, 40%)';
    const tooltipBorder = isDarkMode ? 'hsl(215, 25%, 22%)' : 'hsl(215, 20%, 85%)';

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipTitle,
                bodyColor: tooltipBody,
                borderColor: tooltipBorder,
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10,
                displayColors: true,
                boxPadding: 8,
                callbacks: {
                    label: (item) => `${item.dataset.label}: ${item.formattedValue} ${t("latest.ping_unit")}`
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    color: tickColor,
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
                    color: gridColor,
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: tickColor,
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
                    color: gridColor,
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: tickColor
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
                label: t("latest.ping"),
                data: filteredData.data,
                borderColor: 'hsl(38, 92%, 50%)',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                    gradient.addColorStop(0, 'hsla(38, 92%, 50%, 0.25)');
                    gradient.addColorStop(1, 'hsla(38, 92%, 50%, 0.01)');
                    return gradient;
                },
                fill: true,
                pointBackgroundColor: 'hsl(38, 92%, 50%)',
                pointBorderColor: 'hsl(38, 92%, 50%)',
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
        <div className="chart-container ping-chart" onClick={props.onClick}>
            <div className="chart-header">
                <h3 className="chart-title">{t("latest.ping")} ({t("latest.ping_unit")})</h3>
            </div>
            <div className="chart-body">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default PingChart;