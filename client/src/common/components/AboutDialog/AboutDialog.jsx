import {DialogContext, DialogProvider} from "@/common/contexts/Dialog";
import "./styles.sass";
import React, {useContext, useEffect, useState} from "react";
import {t} from "i18next";
import {Trans} from "react-i18next";
import {faClose, faGlobe, faHeart, faLanguage} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {jsonRequest} from "@/common/utils/RequestUtil";
import {PROJECT_URL, WEB_URL, DONATION_URL} from "@/index";

const Dialog = ({version}) => {
    const close = useContext(DialogContext);

    const links = [
        {icon: faGithub, label: t("about.github"), url: PROJECT_URL},
        {icon: faGlobe, label: t("about.website"), url: WEB_URL},
        {icon: faHeart, label: t("about.donate"), url: DONATION_URL, accent: true},
        {icon: faLanguage, label: t("about.translate"), url: "https://crowdin.com/project/myspeed"}
    ];

    return (
        <>
            <div className="dialog-header">
                <h4 className="dialog-text">{t("about.title")}</h4>
                <FontAwesomeIcon icon={faClose} className="dialog-text dialog-icon" onClick={() => close()}/>
            </div>

            <div className="about-wrapper">
                <div className="about-hero">
                    <img src="/assets/img/logo192.png" alt="MySpeed Logo" className="about-logo"/>
                    <div className="about-title-section">
                        <h1 className="about-title">MySpeed</h1>
                        <span className="about-version">v{version}</span>
                    </div>
                </div>

                <p className="about-description">
                    <Trans i18nKey="about.description">
                        MySpeed is an open-source speedtest analysis software that records your internet speed for up to 30 days.
                    </Trans>
                </p>

                <div className="about-links">
                    {links.map((link, index) => (
                        <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                           className={"about-link" + (link.accent ? " about-link-accent" : "")}>
                            <FontAwesomeIcon icon={link.icon}/>
                            <span>{link.label}</span>
                        </a>
                    ))}
                </div>

                <p className="about-footer">
                    {t("about.made_by")} <FontAwesomeIcon icon={faHeart} className="about-heart"/> by <a href="https://github.com/gnmyt" target="_blank" rel="noopener noreferrer">GNMYT</a>
                </p>
            </div>
        </>
    );
};

export const AboutDialog = (props) => {
    const [version, setVersion] = useState(null);

    useEffect(() => {
        jsonRequest("/info/version").then(data => setVersion(data.local));
    }, []);

    return (
        <DialogProvider close={props.onClose} customClass={!version ? "dialog-loading" : "about-dialog"}>
            {!version && (
                <div className="lds-ellipsis"><div/><div/><div/><div/></div>
            )}
            {version && <Dialog version={version}/>}
        </DialogProvider>
    );
};
