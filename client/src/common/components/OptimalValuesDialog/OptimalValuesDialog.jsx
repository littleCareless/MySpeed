import {DialogContext, DialogProvider} from "@/common/contexts/Dialog";
import {t} from "i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDown, faArrowUp, faCheck, faClose, faExclamationTriangle, faTableTennis, faWandMagicSparkles} from "@fortawesome/free-solid-svg-icons";
import "./styles.sass";
import React, {useContext, useEffect, useState} from "react";
import {jsonRequest, patchRequest} from "@/common/utils/RequestUtil";
import {ConfigContext} from "@/common/contexts/Config";
import {ToastNotificationContext} from "@/common/contexts/ToastNotification";

export const Dialog = () => {
    const close = useContext(DialogContext);
    const [config, reloadConfig] = useContext(ConfigContext);
    const updateToast = useContext(ToastNotificationContext);

    const [ping, setPing] = useState(config.ping || "");
    const [download, setDownload] = useState(config.download || "");
    const [upload, setUpload] = useState(config.upload || "");
    const [recommendations, setRecommendations] = useState(null);

    useEffect(() => {
        jsonRequest("/recommendations").then((result) => {
            if (!result.message) setRecommendations(result);
        }).catch(() => {});
    }, []);

    const applyRecommendations = () => {
        if (recommendations) {
            setPing(recommendations.ping.toString());
            setDownload(recommendations.download.toString());
            setUpload(recommendations.upload.toString());
        }
    };

    const update = async () => {
        if ((ping && /[^0-9.]/.test(ping)) || (download && /[^0-9.]/.test(download)) || (upload && /[^0-9.]/.test(upload))) {
            updateToast(t("dropdown.invalid"), "red", faExclamationTriangle);
            return;
        }

        try {
            if (ping !== config.ping) await patchRequest("/config/ping", {value: ping});
            if (download !== config.download) await patchRequest("/config/download", {value: download});
            if (upload !== config.upload) await patchRequest("/config/upload", {value: upload});

            reloadConfig();
            updateToast(t("dropdown.changes_applied"), "green", faCheck);
            close();
        } catch (e) {
            updateToast(t("dropdown.changes_unsaved"), "red", faExclamationTriangle);
        }
    };

    return (
        <>
            <div className="dialog-header">
                <h4 className="dialog-text">{t("optimal_values.title")}</h4>
                <FontAwesomeIcon icon={faClose} className="dialog-text dialog-icon" onClick={() => close()}/>
            </div>
            <div className="optimal-values-content">
                <div className="optimal-values-speeds">
                    <div className="optimal-values-speed">
                        <div className="optimal-values-speed-header">
                            <FontAwesomeIcon icon={faTableTennis}/>
                            <div className="optimal-values-speed-text">
                                <h2>{t("latest.ping")}</h2>
                                <p>{t("welcome.ms")}</p>
                            </div>
                        </div>
                        <input type="number" placeholder={recommendations?.ping || ""} className="dialog-input"
                               value={ping} onChange={(e) => setPing(e.target.value)}/>
                    </div>
                    <div className="optimal-values-speed">
                        <div className="optimal-values-speed-header">
                            <FontAwesomeIcon icon={faArrowDown}/>
                            <div className="optimal-values-speed-text">
                                <h2>{t("latest.down")}</h2>
                                <p>{t("welcome.mbps")}</p>
                            </div>
                        </div>
                        <input type="number" placeholder={recommendations?.download || ""} className="dialog-input"
                               value={download} onChange={(e) => setDownload(e.target.value)}/>
                    </div>
                    <div className="optimal-values-speed">
                        <div className="optimal-values-speed-header">
                            <FontAwesomeIcon icon={faArrowUp}/>
                            <div className="optimal-values-speed-text">
                                <h2>{t("latest.up")}</h2>
                                <p>{t("welcome.mbps")}</p>
                            </div>
                        </div>
                        <input type="number" placeholder={recommendations?.upload || ""} className="dialog-input"
                               value={upload} onChange={(e) => setUpload(e.target.value)}/>
                    </div>
                </div>

                {recommendations && (
                    <div className="optimal-values-recommendation" onClick={applyRecommendations}>
                        <FontAwesomeIcon icon={faWandMagicSparkles}/>
                        <span>{t("optimal_values.apply_recommendations")}</span>
                    </div>
                )}
            </div>
            <div className="dialog-buttons">
                <button className="dialog-btn" onClick={update}>{t("dialog.update")}</button>
            </div>
        </>
    );
};

export const OptimalValuesDialog = (props) => {
    return (
        <DialogProvider close={props.onClose}>
            <Dialog/>
        </DialogProvider>
    );
};
