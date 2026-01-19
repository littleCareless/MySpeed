import {DialogContext, DialogProvider} from "@/common/contexts/Dialog";
import "./styles.sass";
import React, {useContext, useEffect, useState} from "react";
import {t} from "i18next";
import i18n from "i18next";
import {
    faCheck,
    faCircleNodes,
    faClose,
    faExclamationTriangle,
    faFloppyDisk,
    faTrash,
    faTrashArrowUp
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {deleteRequest, jsonRequest, patchRequest, putRequest} from "@/common/utils/RequestUtil";
import {v4 as uuid} from 'uuid';
import {ConfigContext} from "@/common/contexts/Config";
import {generateRelativeTime} from "@/pages/Home/components/LatestTest/utils";
import FormField from "@/common/components/FormField";
import ExpandableCard from "@/common/components/ExpandableCard";
import DropdownSelect from "@/common/components/DropdownSelect";

const IntegrationCard = ({integration, integrationDef, onRemove, onUpdate}) => {
    const [config] = useContext(ConfigContext);
    const [displayName, setDisplayName] = useState(integration.displayName || t(`integrations.${integration.name}.title`));
    const [fields, setFields] = useState(() => {
        const initial = {};
        integrationDef.fields.forEach(field => {
            initial[field.name] = integration.data?.[field.name] ?? (field.type === "boolean" ? false : "");
        });
        return initial;
    });
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [saveConfirmed, setSaveConfirmed] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [error, setError] = useState(false);
    const [lastActivity, setLastActivity] = useState(generateRelativeTime(integration.lastActivity));

    useEffect(() => {
        const interval = setInterval(() => {
            if (integration.lastActivity) setLastActivity(generateRelativeTime(integration.lastActivity));
        }, 1000);
        return () => clearInterval(interval);
    }, [integration.lastActivity]);

    const updateField = (name, value) => {
        setFields(prev => ({...prev, [name]: value}));
        setUnsavedChanges(true);
    };

    const updateDisplayName = (value) => {
        setDisplayName(value);
        setUnsavedChanges(true);
    };

    const isValidInput = (field) => {
        const value = fields[field.name];
        if (field.required && !value) return false;
        if (field.regex && value && !new RegExp(field.regex).test(value)) return false;
        if (field.type === "text" && value && value.length > 255) return false;
        if (field.type === "textarea" && value && value.length > 2000) return false;
        return true;
    };

    const getPlaceholder = (fieldName) => {
        const placeholderKey = `integrations.${integration.name}.fields.${fieldName}_placeholder`;
        const baseKey = `integrations.${integration.name}.fields.${fieldName}`;
        return i18n.exists(placeholderKey) ? t(placeholderKey) : t(baseKey);
    };

    const handleSave = async () => {
        const data = {...fields, integration_name: displayName};

        try {
            if (!integration.id) {
                const response = await putRequest(`/integrations/${integration.name}`, data);
                if (!response.ok) throw new Error();
                const result = await response.json();
                onUpdate(integration.uuid, {id: result.id, isNew: false});
            } else {
                const response = await patchRequest(`/integrations/${integration.id}`, data);
                if (!response.ok) throw new Error();
            }
            setUnsavedChanges(false);
            setSaveConfirmed(true);
            setError(false);
            setTimeout(() => setSaveConfirmed(false), 1500);
        } catch {
            setError(true);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmed) {
            setDeleteConfirmed(true);
            setTimeout(() => setDeleteConfirmed(false), 3000);
            return;
        }

        if (!integration.id) {
            onRemove(integration.uuid);
            return;
        }

        await deleteRequest(`/integrations/${integration.id}`);
        onRemove(integration.uuid);
    };

    const getStatusClass = () => {
        if (integration.activityFailed) return "status-error";
        if (!integration.lastActivity) return "status-inactive";
        return "status-active";
    };

    const getStatusText = () => {
        if (integration.activityFailed) return t("failed");
        if (!integration.lastActivity) return t("integrations.activity.never_executed");
        return t("integrations.activity.last_run") + lastActivity;
    };

    const cardActions = (
        <>
            {!config.previewMode && unsavedChanges && !saveConfirmed && (
                <button className="card-action-btn save-btn" onClick={(e) => {e.stopPropagation(); handleSave();}}>
                    <FontAwesomeIcon icon={faFloppyDisk}/>
                </button>
            )}
            {saveConfirmed && (
                <span className="card-action-btn success-indicator">
                    <FontAwesomeIcon icon={faCheck}/>
                </span>
            )}
            {!config.previewMode && (
                <button className={`card-action-btn delete-btn ${deleteConfirmed ? "confirm" : ""}`}
                        onClick={(e) => {e.stopPropagation(); handleDelete();}}>
                    <FontAwesomeIcon icon={deleteConfirmed ? faTrashArrowUp : faTrash}/>
                </button>
            )}
        </>
    );

    return (
        <ExpandableCard
            icon={integrationDef.icon}
            title={displayName}
            subtitle={getStatusText()}
            statusDot={getStatusClass()}
            actions={cardActions}
            defaultExpanded={integration.isNew || false}
            error={error}
            success={saveConfirmed}
        >
            <FormField
                label={t("integrations.display_name")}
                type="text"
                value={displayName}
                onChange={updateDisplayName}
                placeholder={t("integrations.display_name")}
            />

            {integrationDef.fields.map((field) => (
                <FormField
                    key={field.name}
                    label={t(`integrations.${integration.name}.fields.${field.name}`)}
                    type={field.type}
                    value={fields[field.name]}
                    onChange={(value) => updateField(field.name, value)}
                    placeholder={getPlaceholder(field.name)}
                    error={!isValidInput(field)}
                />
            ))}
        </ExpandableCard>
    );
};

const Dialog = ({integrations, active, setActive}) => {
    const close = useContext(DialogContext);
    const [config] = useContext(ConfigContext);

    const addIntegration = (item) => {
        setActive([...active, {
            uuid: uuid(),
            name: item.key,
            data: {},
            isNew: true
        }]);
    };

    const removeIntegration = (uuid) => {
        setActive(active.filter(item => item.uuid !== uuid));
    };

    const updateIntegration = (uuid, updates) => {
        setActive(active.map(item =>
            item.uuid === uuid ? {...item, ...updates} : item
        ));
    };

    const dropdownItems = Object.entries(integrations).map(([name, def]) => ({
        key: name,
        label: t(`integrations.${name}.title`),
        icon: def.icon
    }));

    return (
        <>
            <div className="dialog-header">
                <h4 className="dialog-text">{t("dropdown.integrations")}</h4>
                <FontAwesomeIcon icon={faClose} className="dialog-text dialog-icon" onClick={() => close()}/>
            </div>

            <div className="integrations-wrapper">
                {config.previewMode && active.length > 0 && (
                    <div className="preview-warning">
                        <FontAwesomeIcon icon={faExclamationTriangle}/>
                        <span>{t("integrations.preview_active")}</span>
                    </div>
                )}

                {active.length === 0 ? (
                    <div className="empty-state">
                        <FontAwesomeIcon icon={faCircleNodes}/>
                        <p>{t("integrations.none_active").replace("<br/>", " ").replace("<Bold>", "").replace("</Bold>", "")}</p>
                        <DropdownSelect
                            items={dropdownItems}
                            onSelect={addIntegration}
                            buttonText={t("integrations.create")}
                            disabled={config.previewMode}
                        />
                    </div>
                ) : (
                    <>
                        <div className="integrations-list">
                            {active.map(item => (
                                <IntegrationCard
                                    key={item.uuid}
                                    integration={item}
                                    integrationDef={integrations[item.name]}
                                    onRemove={removeIntegration}
                                    onUpdate={updateIntegration}
                                />
                            ))}
                        </div>
                        <DropdownSelect
                            items={dropdownItems}
                            onSelect={addIntegration}
                            buttonText={t("integrations.create")}
                            disabled={config.previewMode}
                        />
                    </>
                )}
            </div>
        </>
    );
};

export const IntegrationDialog = (props) => {
    const [integrationData, setIntegrationData] = useState(undefined);
    const [activeData, setActiveData] = useState(undefined);

    useEffect(() => {
        jsonRequest("/integrations").then(data => setIntegrationData(data));
        jsonRequest("/integrations/active").then(data =>
            setActiveData(data.map(item => ({...item, uuid: uuid()})))
        );
    }, []);

    return (
        <DialogProvider close={props.onClose} customClass={(!integrationData || !activeData) ? "dialog-loading" : ""}>
            {(!integrationData || !activeData) && (
                <div className="lds-ellipsis"><div/><div/><div/><div/></div>
            )}
            {integrationData && activeData && (
                <Dialog integrations={integrationData} active={activeData} setActive={setActiveData}/>
            )}
        </DialogProvider>
    );
};