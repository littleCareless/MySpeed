import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import { t } from "i18next";
import "./SpeedChart/styles.sass";

const HourlyChart = (props) => {
    const chartData = useMemo(() => {
        if (!props.hourlyAverages) return { labels: [], datasets: [] };

        const labels = props.hourlyAverages.map(h => {
            const hour = h.hour;
            return `${hour.toString().padStart(2, '0')}:00`;
        });

        return {
            labels,
            datasets: [
                {
                    label: t("latest.down"),
                    data: props.hourlyAverages.map(h => h.download),
                    backgroundColor: 'hsla(187, 100%, 50%, 0.7)',
                    borderColor: 'hsl(187, 100%, 50%)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: t("latest.up"),
                    data: props.hourlyAverages.map(h => h.upload),
                    backgroundColor: 'hsla(280, 70%, 60%, 0.7)',
                    borderColor: 'hsl(280, 70%, 60%)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        };
    }, [props.hourlyAverages]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                backgroundColor: 'hsl(220, 35%, 11%)',
                titleColor: 'hsl(210, 20%, 92%)',
                bodyColor: 'hsl(215, 15%, 60%)',
                borderColor: 'hsl(220, 25%, 20%)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 6,
                callbacks: {
                    label: (item) => `${item.dataset.label}: ${item.formattedValue} ${t("latest.speed_unit")}`,
                    afterBody: (items) => {
                        const hourIndex = items[0].dataIndex;
                        const count = props.hourlyAverages[hourIndex]?.count || 0;
                        return `\n${t("statistics.hourly.sample_count")}: ${count}`;
                    }
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'hsla(220, 25%, 20%, 0.5)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: 'hsl(215, 15%, 50%)',
                    maxRotation: 0
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'hsla(220, 25%, 20%, 0.5)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: 'hsl(215, 15%, 50%)'
                }
            }
        }
    };

    return (
        <div className="chart-container" onClick={props.onClick}>
            <div className="chart-header">
                <h3 className="chart-title">{t("statistics.hourly.title")}</h3>
            </div>
            <div className="chart-body">
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default HourlyChart;
