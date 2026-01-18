import "./styles.sass";
import Screenshot1 from "@/common/assets/sc1.png";
import Screenshot2 from "@/common/assets/sc2.png";

export const Features = () => {
    return (
        <section className="features-section">
            <div className="section-header">
                <span className="section-label">How it works</span>
                <h2>Everything you need to monitor your network</h2>
                <p>Simple setup, powerful insights. Get complete visibility into your internet performance.</p>
            </div>

            <div className="feature-blocks">
                <div className="feature-block">
                    <div className="feature-content">
                        <span className="feature-number">01</span>
                        <h3>Automated Speed Tests</h3>
                        <p>
                            Set your schedule and let MySpeed handle the rest. Tests run automatically 
                            in the background, so you always have up-to-date data about your connection.
                        </p>
                        <ul className="feature-list">
                            <li>Customizable test intervals</li>
                            <li>Multiple provider support</li>
                            <li>Background operation</li>
                        </ul>
                    </div>
                    <div className="feature-image">
                        <img src={Screenshot1} alt="Automated speed testing interface"/>
                    </div>
                </div>

                <div className="feature-block feature-reverse">
                    <div className="feature-content">
                        <span className="feature-number">02</span>
                        <h3>Detailed Analytics</h3>
                        <p>
                            View your speed history with clear visualizations. Track download, upload, 
                            and ping over time to identify patterns and issues.
                        </p>
                        <ul className="feature-list">
                            <li>Historical data graphs</li>
                            <li>Performance trends</li>
                            <li>Issue detection</li>
                        </ul>
                    </div>
                    <div className="feature-image">
                        <img src={Screenshot2} alt="Speed test analytics dashboard"/>
                    </div>
                </div>
            </div>
        </section>
    )
}