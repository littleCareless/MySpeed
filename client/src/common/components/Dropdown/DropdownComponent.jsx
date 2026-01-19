import React, {useContext, useEffect, useRef, useState} from "react";
import "./styles.sass";
import {
    faCircleNodes,
    faClock,
    faGlobeEurope,
    faInfo,
    faKey,
    faPause,
    faPlay,
    faCheck,
    faExclamationTriangle, 
    faSliders, 
    faHardDrive,
    faMoon,
    faSun,
    faGauge
} from "@fortawesome/free-solid-svg-icons";
import {ConfigContext} from "@/common/contexts/Config";
import {StatusContext} from "@/common/contexts/Status";
import {InputDialogContext} from "@/common/contexts/InputDialog";
import {ThemeContext} from "@/common/contexts/Theme";
import {baseRequest, patchRequest, postRequest} from "@/common/utils/RequestUtil";
 import {levelOptions, selectOptions} from "@/common/components/Dropdown/utils/options";
import {parseCron, stringifyCron} from "@/common/components/Dropdown/utils/utils";
import {t} from "i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {ToastNotificationContext} from "@/common/contexts/ToastNotification";
import {NodeContext} from "@/common/contexts/Node";
import {IntegrationDialog} from "@/common/components/IntegrationDialog";
import LanguageDialog from "@/common/components/LanguageDialog";
import ProviderDialog from "@/common/components/ProviderDialog";
import StorageDialog from "@/common/components/StorageDialog";
import OptimalValuesDialog from "@/common/components/OptimalValuesDialog";

const DropdownComponent = ({isOpen, switchDropdown}) => {
    const [config, reloadConfig] = useContext(ConfigContext);
    const [status, updateStatus] = useContext(StatusContext);
    const [isDarkMode, toggleTheme] = useContext(ThemeContext);
    const findNode = useContext(NodeContext)[4];
    const updateNodes = useContext(NodeContext)[1];
    const currentNode = useContext(NodeContext)[2];
    const updateToast = useContext(ToastNotificationContext);
    const [setDialog] = useContext(InputDialogContext);
    const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
    const [showLanguageDialog, setShowLanguageDialog] = useState(false);
    const [showProviderDialog, setShowProviderDialog] = useState(false);
    const [showStorageDialog, setShowStorageDialog] = useState(false);
    const [showOptimalValuesDialog, setShowOptimalValuesDialog] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const onPress = event => {
            if (event.code === "Escape" && isOpen) {
                switchDropdown();
            }
        }

        const onClick = event => {
            let headerIcon = event.composedPath()[1].id || event.composedPath()[2].id;
            if (isOpen && !ref.current.contains(event.target) && headerIcon !== "open-header") {
                switchDropdown();
            }
        }

        document.addEventListener("mousedown", onClick);
        document.addEventListener("keyup", onPress);
        return () => {
            document.removeEventListener("keyup", onPress);
            document.removeEventListener("mousedown", onClick);
        }
    }, [isOpen]);
    const showFeedback = (customText = "dropdown.changes_applied", reload = true) => {
        updateToast(t(customText), customText === "dropdown.changes_unsaved" ? "red" : "green",
            customText === "dropdown.changes_unsaved" ? faExclamationTriangle : faCheck);

        if (reload) reloadConfig();
    }

    const patchDialog = async (key, dialog, postValue = (val) => val) => {
        setTimeout(async () => setDialog({...(await dialog(config[key])),
            onSuccess: value => patchRequest(`/config/${key}`, {value: postValue(value)})
                .then(res => showFeedback(!res.ok ? "dropdown.changes_unsaved" : undefined))
        }), 160);
    }

    const updatePassword = async () => {
        const passwordSet = currentNode !== 0 ? findNode(currentNode).password : localStorage.getItem("password") != null;

        setDialog({
            title: <>{t("update.new_password")} » <a onClick={updatePasswordLevel}>{t("update.level")}</a></>,
            placeholder: t("update.password_placeholder"),
            type: "password",
            unsetButton: passwordSet ? t("dialog.password.unlock") : undefined,
            onClear: () => patchRequest("/config/password", {value: "none"})
                .then(() => showFeedback("update.password_removed", false))
                .then(() => {
                    currentNode !== 0 ? baseRequest("/nodes/" + currentNode + "/password", "PATCH",
                        {password: "none"}).then(() => updateNodes()) : localStorage.removeItem("password");
                }),
            onSuccess: (value) => patchRequest("/config/password", {value})
                .then(() => showFeedback(undefined, false))
                .then(() => {
                    currentNode !== 0 ? baseRequest("/nodes/" + currentNode + "/password", "PATCH",
                        {password: value}).then(() => updateNodes()) : localStorage.setItem("password", value);
                })
        })
    }

    const updatePasswordLevel = () => patchDialog("passwordLevel", async (value) => ({
        title: t("update.level_title"), select: true, selectOptions: levelOptions(), value, replace: true
    }));

    const updateCron = async () => {
        setDialog({
            title: t("update.cron_title"),
            select: true,
            selectOptions: selectOptions(),
            value: config.cron,
            unsetButton: t("update.manually"),
            onClear: updateCronManually,
            onSuccess: value => patchRequest("/config/cron", {value}).then(() => showFeedback())
        });
    }

    const updateCronManually = () => patchDialog("cron", (value) => ({
        title: <>{t("update.cron_title")} <a href="https://crontab.guru/" target="_blank">?</a></>,
        placeholder: t("update.cron_rules"),
        value: value,
        updateDescription: (val) => <>{t("update.cron_next_test")} <span className="dialog-value">{parseCron(val)}</span></>,
        description: <>{t("update.cron_next_test")} <span className="dialog-value">{parseCron(value)}</span></>
    }), (val) => stringifyCron(val));

    const togglePause = () => {
        if (!status.paused) {
            setDialog({
                title: t("update.pause_title"),
                placeholder: t("update.hours"),
                type: "number",
                buttonText: t("update.pause"),
                unsetButton: t("update.release_manually"),
                onClear: () => postRequest("/speedtests/pause", {resumeIn: -1}).then(updateStatus),
                onSuccess: (hours) => postRequest("/speedtests/pause", {resumeIn: hours}).then(updateStatus)
            });
        } else postRequest("/speedtests/continue").then(updateStatus);
    }

    const showProviderDetails = () => setDialog({title: t("dropdown.provider"), description: config.previewMessage, buttonText: t("dialog.close")});

    const handleThemeToggle = () => {
        toggleTheme();
        updateToast(t(isDarkMode ? "dropdown.theme_switched_light" : "dropdown.theme_switched_dark"), "green", isDarkMode ? faSun : faMoon);
    };

    const options = [
        {run: () => setShowOptimalValuesDialog(true), icon: faGauge, text: t("dropdown.optimal_values")},
        {hr: true, key: 1},
        {run: () => setShowProviderDialog(true), icon: faSliders, text: t("dropdown.change_provider")},
        {run: () => setShowStorageDialog(true), icon: faHardDrive, text: t("dropdown.storage")},
        {run: updatePassword, icon: faKey, text: t("dropdown.password"), previewHidden: true},
        {run: updateCron, icon: faClock, text: t("dropdown.cron")},
        {run: togglePause, icon: status.paused ? faPlay : faPause, text: t("dropdown." + (status.paused ? "resume_tests" : "pause_tests"))},
        {run: () => setShowIntegrationDialog(true), icon: faCircleNodes, text: t("dropdown.integrations")},
        {hr: true, key: 2},
        {run: handleThemeToggle, icon: isDarkMode ? faSun : faMoon, text: t(isDarkMode ? "dropdown.light_mode" : "dropdown.dark_mode"), allowView: true},
        {run: () => setShowLanguageDialog(true), icon: faGlobeEurope, text: t("dropdown.language"), allowView: true},
        {run: showProviderDetails, icon: faInfo, text: t("dropdown.provider"), previewShown: true}
    ];

    return (
        <>
            {showIntegrationDialog && <IntegrationDialog onClose={() => setShowIntegrationDialog(false)}/>}
            {showLanguageDialog && <LanguageDialog onClose={() => setShowLanguageDialog(false)}/>}
            {showProviderDialog && <ProviderDialog onClose={() => setShowProviderDialog(false)}/>}
            {showStorageDialog && <StorageDialog onClose={() => setShowStorageDialog(false)}/>}
            {showOptimalValuesDialog && <OptimalValuesDialog onClose={() => setShowOptimalValuesDialog(false)}/>}
            <div className={`dropdown ${isOpen ? '' : 'dropdown-invisible'}`} ref={ref}>
                <div className="dropdown-content">
                    <h2>{t("dropdown.settings")}</h2>
                    <div className="dropdown-entries">
                        {options.map(entry => {
                            if (entry.previewHidden && config.previewMode) return;
                            if (entry.previewShown && !config.previewMode) return;
                            if (!config.viewMode || (config.viewMode && entry.allowView)) {
                                if (!entry.hr) {
                                    return (<div className="dropdown-item" onClick={() => {
                                        switchDropdown();
                                        entry.run();
                                    }} key={entry.run}>
                                        <FontAwesomeIcon icon={entry.icon}/>
                                        <h3>{entry.text}</h3>
                                    </div>);
                                } else return (<div className="center" key={entry.key}>
                                    <hr className="dropdown-hr"/>
                                </div>);
                            }
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default DropdownComponent;