import "./styles.sass";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGlobe, faLayerGroup, faBell, faClock} from "@fortawesome/free-solid-svg-icons";

export const TRANSLATIONS_LINK = "https://crowdin.com/project/myspeed";

const features = [
    {
        icon: faGlobe,
        title: "Multilingual",
        description: "Available in multiple languages including English and German. Help translate on Crowdin.",
        link: TRANSLATIONS_LINK
    },
    {
        icon: faLayerGroup,
        title: "Multiple Views",
        description: "Choose between different visualization options to display your speed data the way you prefer."
    },
    {
        icon: faBell,
        title: "Integrations",
        description: "Connect with Discord, Telegram, HealthChecks, custom webhooks, and more notification services."
    },
    {
        icon: faClock,
        title: "Flexible Scheduling",
        description: "Configure tests to run every 5 minutes or every 5 hours. You decide what works for you."
    }
];

export const FeatureGrid = () => {
    return (
        <section className="feature-grid-section">
            <div className="section-header">
                <span className="section-label">Features</span>
                <h2>Built for your workflow</h2>
            </div>
            
            <div className="feature-grid">
                {features.map((feature, index) => (
                    <div key={index} className="feature-card">
                        <div className="feature-icon">
                            <FontAwesomeIcon icon={feature.icon}/>
                        </div>
                        <h3>{feature.title}</h3>
                        <p>
                            {feature.description}
                            {feature.link && (
                                <> <a href={feature.link} target="_blank" rel="noopener noreferrer">Learn more →</a></>
                            )}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}