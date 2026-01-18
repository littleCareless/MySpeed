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
                    backgroundColor: 'hsla(187, 94%, 43%, 0.75)',
                    borderColor: 'hsl(187, 94%, 43%)',
                    borderWidth: 1.5,
                    borderRadius: 6
                },
                {
                    label: t("latest.up"),
                    data: props.hourlyAverages.map(h => h.upload),
                    backgroundColor: 'hsla(258, 90%, 66%, 0.75)',
                    borderColor: 'hsl(258, 90%, 66%)',
                    borderWidth: 1.5,
                    borderRadius: 6
                }
            ]
        };
    }, [props.hourlyAverages]);

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
                        size: 12,
                        weight: 500
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'hsla(215, 25%, 22%, 0.4)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: 'hsl(215, 20%, 50%)',
                    maxRotation: 0
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
                    color: 'hsl(215, 20%, 50%)'
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
