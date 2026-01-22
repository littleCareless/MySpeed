import {
    ArcElement, BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Filler
} from "chart.js";
import {useEffect, useState, useCallback} from "react";
import {jsonRequest} from "@/common/utils/RequestUtil";
import DateRangePicker from "@/common/components/DateRangePicker";
import ChartModal from "@/common/components/ChartModal";
import SpeedChart from "@/pages/Statistics/charts/SpeedChart";
import LatestTestChart from "@/pages/Statistics/charts/LatestTestChart";
import PingChart from "@/pages/Statistics/charts/PingChart";
import OverviewChart from "@/pages/Statistics/charts/OverviewChart";
import AverageChart from "@/pages/Statistics/charts/AverageChart";
import HourlyChart from "@/pages/Statistics/charts/HourlyChart.jsx";
import ConsistencyChart from "@/pages/Statistics/charts/ConsistencyChart";
import i18n, {t} from "i18next";
import "./styles.sass";

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, PointElement, LineElement, Title, Legend, BarElement, RadialLinearScale, Filler);

const crosshairPlugin = {
    id: 'crosshair',
    afterDraw: (chart) => {
        if (chart.tooltip?._active?.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'hsla(215, 20%, 65%, 0.6)';
            ctx.stroke();
            ctx.restore();
        }
    }
};

ChartJS.register(crosshairPlugin);

ChartJS.defaults.color = "hsl(215, 20%, 55%)";
ChartJS.defaults.font.color = "hsl(215, 20%, 55%)";
ChartJS.defaults.font.family = "Inter, sans-serif";
ChartJS.defaults.font.weight = 500;
ChartJS.defaults.font.size = 11;
ChartJS.defaults.elements.line.tension = 0.35;
ChartJS.defaults.elements.line.borderWidth = 2.5;
ChartJS.defaults.elements.point.radius = 0;
ChartJS.defaults.elements.point.hoverRadius = 5;
ChartJS.defaults.elements.point.hoverBorderWidth = 2;
ChartJS.defaults.elements.arc.borderWidth = 0;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = 'circle';
ChartJS.defaults.plugins.legend.labels.padding = 16;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
ChartJS.defaults.plugins.legend.labels.boxHeight = 8;


export const Statistics = () => {
    const [statistics, setStatistics] = useState(null);
    const [latestTest, setLatestTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedChart, setExpandedChart] = useState(null);

    const [dateRange, setDateRange] = useState(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 7);
        return { from, to };
    });

    const formatDateParam = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const updateStats = useCallback(() => {
        setLoading(true);
        const fromParam = formatDateParam(dateRange.from);
        const toParam = formatDateParam(dateRange.to);
        
        return Promise.all([
            jsonRequest(`/speedtests/statistics/?from=${fromParam}&to=${toParam}`),
            jsonRequest("/speedtests?limit=1")
        ])
        .then(([stats, tests]) => {
            setStatistics(stats);
            setLatestTest(tests.length > 0 ? tests[0] : null);
            setLoading(false);
        })
        .catch(error => {
            console.error("Failed to load statistics:", error);
            setLoading(false);
        });
    }, [dateRange]);

    const handleDateRangeChange = (from, to) => {
        setDateRange({ from, to });
    };

    useEffect(() => {
        updateStats();
    }, [updateStats]);

    useEffect(() => {
        const callback = () => updateStats();
        i18n.on("languageChanged", callback);
        return () => i18n.off("languageChanged", callback);
    }, []);

    if (loading) return <></>;
    if (!statistics) return <></>;
    if (!statistics.tests || statistics.tests.length === 0) return <h2 className="error-text">{t("test.not_available")}</h2>;

    const renderChart = (chartType) => {
        switch (chartType) {
            case 'overview':
                return <OverviewChart tests={statistics.tests} time={statistics.time} dateRange={dateRange}/>;
            case 'latest':
                return <LatestTestChart test={latestTest}/>;
            case 'consistency':
                return <ConsistencyChart consistency={statistics.consistency}/>;
            case 'download':
                return <SpeedChart labels={statistics.labels} data={statistics.data} dataKey="download" titleKey="latest.down" color="hsl(187, 94%, 43%)" failed={statistics.failed} errors={statistics.errors} />;
            case 'upload':
                return <SpeedChart labels={statistics.labels} data={statistics.data} dataKey="upload" titleKey="latest.up" color="hsl(258, 90%, 66%)" failed={statistics.failed} errors={statistics.errors} />;
            case 'ping':
                return <PingChart labels={statistics.labels} data={statistics.data} failed={statistics.failed} errors={statistics.errors}/>;
            case 'hourly':
                return <HourlyChart hourlyAverages={statistics.hourlyAverages}/>;
            case 'avgDownload':
                return <AverageChart title={t("statistics.values.down")} data={statistics.download}/>;
            case 'avgUpload':
                return <AverageChart title={t("statistics.values.up")} data={statistics.upload}/>;
            default:
                return null;
        }
    };

    return (
        <div className="statistic-area">
            <div className="statistics-header">
                <DateRangePicker 
                    from={dateRange.from} 
                    to={dateRange.to} 
                    onChange={handleDateRangeChange}
                />
            </div>

            <OverviewChart tests={statistics.tests} time={statistics.time} dateRange={dateRange} onClick={() => setExpandedChart('overview')}/>
            <LatestTestChart test={latestTest} onClick={() => setExpandedChart('latest')}/>
            <ConsistencyChart consistency={statistics.consistency} onClick={() => setExpandedChart('consistency')}/>

            <SpeedChart labels={statistics.labels} data={statistics.data} dataKey="download" titleKey="latest.down" color="hsl(187, 94%, 43%)" failed={statistics.failed} errors={statistics.errors} onClick={() => setExpandedChart('download')} compact/>
            <SpeedChart labels={statistics.labels} data={statistics.data} dataKey="upload" titleKey="latest.up" color="hsl(258, 90%, 66%)" failed={statistics.failed} errors={statistics.errors} onClick={() => setExpandedChart('upload')} compact/>
            <PingChart labels={statistics.labels} data={statistics.data} failed={statistics.failed} errors={statistics.errors} onClick={() => setExpandedChart('ping')} compact/>

            <HourlyChart hourlyAverages={statistics.hourlyAverages} onClick={() => setExpandedChart('hourly')}/>

            <AverageChart title={t("statistics.values.down")} data={statistics.download} onClick={() => setExpandedChart('avgDownload')}/>
            <AverageChart title={t("statistics.values.up")} data={statistics.upload} onClick={() => setExpandedChart('avgUpload')}/>

            <ChartModal 
                isOpen={!!expandedChart} 
                onClose={() => setExpandedChart(null)}
                isChart={['download', 'upload', 'ping', 'hourly'].includes(expandedChart)}
            >
                {expandedChart && renderChart(expandedChart)}
            </ChartModal>
        </div>
    );
}