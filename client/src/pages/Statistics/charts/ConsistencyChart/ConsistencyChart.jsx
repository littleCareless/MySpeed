import { useMemo } from "react";
import { t } from "i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faSignal } from "@fortawesome/free-solid-svg-icons";
import "../DownloadChart/styles.sass";
import "./styles.sass";

export const ConsistencyChart = (props) => {
    const data = useMemo(() => {
        if (!props.consistency) return null;
        return props.consistency;
    }, [props.consistency]);

    if (!data) return null;

    const getConsistencyColor = (value) => {
        if (value >= 90) return 'icon-green';
        if (value >= 70) return 'icon-orange';
        return 'icon-red';
    };

    const getConsistencyLabel = (value) => {
        if (value >= 90) return t("statistics.consistency.excellent");
        if (value >= 70) return t("statistics.consistency.good");
        if (value >= 50) return t("statistics.consistency.fair");
        return t("statistics.consistency.poor");
    };

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">{t("statistics.consistency.title")}</h3>
            </div>
            <div className="chart-body">
                <div className="consistency-container">
                    <div className="consistency-item">
                        <div className="consistency-header">
                            <FontAwesomeIcon icon={faArrowDown} className={getConsistencyColor(data.download.consistency)} />
                            <span>{t("latest.down")}</span>
                        </div>
                        <div className="consistency-value">
                            <span className={"consistency-percent " + getConsistencyColor(data.download.consistency)}>
                                {data.download.consistency}%
                            </span>
                            <span className="consistency-label">{getConsistencyLabel(data.download.consistency)}</span>
                        </div>
                        <div className="consistency-detail">
                            ±{data.download.stdDev} {t("latest.speed_unit")}
                        </div>
                    </div>

                    <div className="consistency-item">
                        <div className="consistency-header">
                            <FontAwesomeIcon icon={faArrowUp} className={getConsistencyColor(data.upload.consistency)} />
                            <span>{t("latest.up")}</span>
                        </div>
                        <div className="consistency-value">
                            <span className={"consistency-percent " + getConsistencyColor(data.upload.consistency)}>
                                {data.upload.consistency}%
                            </span>
                            <span className="consistency-label">{getConsistencyLabel(data.upload.consistency)}</span>
                        </div>
                        <div className="consistency-detail">
                            ±{data.upload.stdDev} {t("latest.speed_unit")}
                        </div>
                    </div>

                    <div className="consistency-item">
                        <div className="consistency-header">
                            <FontAwesomeIcon icon={faSignal} className="icon-orange" />
                            <span>{t("latest.ping")}</span>
                        </div>
                        <div className="consistency-value">
                            <span className="consistency-percent icon-orange">
                                ±{data.ping.stdDev}
                            </span>
                            <span className="consistency-unit">{t("latest.ping_unit")}</span>
                            <span className="consistency-label">{t("statistics.consistency.ping_variance")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};