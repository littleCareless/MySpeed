import {useContext, useEffect, useState, useRef, useMemo} from "react";
import {faArrowDown, faArrowUp, faClockRotateLeft, faPingPongPaddleBall} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {generateRelativeTime} from "./utils";
import {StatusContext} from "@/common/contexts/Status";
import {InputDialogContext} from "@/common/contexts/InputDialog";
import {SpeedtestContext} from "@/common/contexts/Speedtests";
import {ConfigContext} from "@/common/contexts/Config";
import "./styles.sass";
import {getIconBySpeed} from "@/common/utils/TestUtil";
import {downloadInfo, latestTestInfo, pingInfo, uploadInfo} from "@/pages/Home/components/LatestTest/utils/dialogs";
import {t} from "i18next";

const BORDER_RADIUS = 14;
const DASH_LENGTH = 200;
const STROKE_WIDTH = 3;

const BorderAnimation = () => {
    const ref = useRef(null);
    const [size, setSize] = useState({ w: 100, h: 100 });
    
    useEffect(() => {
        const parent = ref.current?.parentElement;
        if (!parent) return;
        
        const update = () => {
            setSize({ w: parent.offsetWidth, h: parent.offsetHeight });
        };
        
        update();
        
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(parent);
        
        return () => resizeObserver.disconnect();
    }, []);
    
    const perimeter = useMemo(() => {
        const inner = { w: size.w - 2, h: size.h - 2 };
        return 2 * (inner.w - 2 * BORDER_RADIUS) + 2 * (inner.h - 2 * BORDER_RADIUS) + 2 * Math.PI * BORDER_RADIUS;
    }, [size]);
    
    return (
        <svg ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
            <rect x={1} y={1} width={size.w - 2} height={size.h - 2} rx={BORDER_RADIUS} ry={BORDER_RADIUS}
                  fill="none" stroke="var(--accent-primary)" strokeWidth={STROKE_WIDTH} strokeLinecap="round"
                  strokeDasharray={`${DASH_LENGTH} ${perimeter}`}
                  style={{ animation: `border-dash 3s linear infinite` }} />
            <style>{`@keyframes border-dash { to { stroke-dashoffset: -${perimeter + DASH_LENGTH}; } }`}</style>
        </svg>
    );
};

const LoadingValue = ({ children }) => {
    return (
        <span className="loading-value">{children}</span>
    );
};

const LatestTestComponent = () => {
    const status = useContext(StatusContext)[0];
    const [latest, setLatest] = useState(null);
    const [latestTestTime, setLatestTestTime] = useState("N/A");
    const [setDialog] = useContext(InputDialogContext);
    const {speedtests} = useContext(SpeedtestContext);
    const config = useContext(ConfigContext)[0];

    useEffect(() => {
        setLatest(speedtests.length !== 0 ? speedtests[0] : {ping: "N/A", download: "N/A", upload: "N/A"});
    }, [speedtests]);

    useEffect(() => {
        if (latest) setLatestTestTime(generateRelativeTime(latest.created));
        const interval = setInterval(() => setLatestTestTime(generateRelativeTime(latest ? latest.created : 0)), 1000);
        return () => clearInterval(interval);
    }, [latest]);

    if (Object.entries(config).length === 0) return (<></>);
    if (latest === null) return (<></>);

    const getAreaClass = () => {
        if (status.running) return "analyse-area test-running";
        if (status.paused) return "analyse-area tests-paused";
        return "analyse-area pulse";
    };

    return (
        <div className={getAreaClass()}>
            {status.running && <BorderAnimation />}
            <div className="inner-container">
                <div className="container-header">
                    <FontAwesomeIcon onClick={() => setDialog(pingInfo())} icon={faPingPongPaddleBall}
                                     className={"container-icon help-icon icon-" + getIconBySpeed(latest.ping, config.ping, false)}/>
                    <h2 className="container-text">{t("latest.ping")}<span
                        className="container-subtext">{t("latest.ping_unit")}</span></h2>
                </div>
                <div className="container-main">
                    <h2>
                        {status.running ? (
                            <LoadingValue>{latest.ping === -1 ? "N/A" : latest.ping}</LoadingValue>
                        ) : (
                            latest.ping === -1 ? "N/A" : latest.ping
                        )}
                    </h2>
                </div>
            </div>

            <div className="inner-container">
                <div className="container-header">
                    <FontAwesomeIcon onClick={() => setDialog(downloadInfo())} icon={faArrowDown}
                                     className={"container-icon help-icon icon-" + getIconBySpeed(latest.download, config.download, true)}/>
                    <h2 className="container-text">{t("latest.down")}<span
                        className="container-subtext">{t("latest.speed_unit")}</span></h2>
                </div>
                <div className="container-main">
                    <h2>
                        {status.running ? (
                            <LoadingValue>{latest.download === -1 ? "N/A" : latest.download}</LoadingValue>
                        ) : (
                            latest.download === -1 ? "N/A" : latest.download
                        )}
                    </h2>
                </div>
            </div>

            <div className="mobile-break"></div>

            <div className="inner-container">
                <div className="container-header">
                    <FontAwesomeIcon onClick={() => setDialog(uploadInfo())} icon={faArrowUp}
                                     className={"container-icon help-icon icon-" + getIconBySpeed(latest.upload, config.upload, true)}/>
                    <h2 className="container-text">{t("latest.up")}<span
                        className="container-subtext">{t("latest.speed_unit")}</span></h2>
                </div>
                <div className="container-main">
                    <h2>
                        {status.running ? (
                            <LoadingValue>{latest.upload === -1 ? "N/A" : latest.upload}</LoadingValue>
                        ) : (
                            latest.upload === -1 ? "N/A" : latest.upload
                        )}
                    </h2>
                </div>
            </div>

            <div className="inner-container">
                <div className="container-header">
                    <FontAwesomeIcon onClick={() => setDialog(latestTestInfo(latest))} icon={faClockRotateLeft}
                                     className="container-icon icon-green help-icon"/>
                    <h2 className="container-text">{t("latest.latest")}<span
                        className="container-subtext">{t("latest.before")}</span></h2>
                </div>
                <div className="container-main">
                    <h2>
                        {status.running ? (
                            <LoadingValue>{latestTestTime}</LoadingValue>
                        ) : (
                            latestTestTime
                        )}
                    </h2>
                </div>
            </div>
        </div>
    )
}

export default LatestTestComponent;