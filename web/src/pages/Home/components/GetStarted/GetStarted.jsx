import "./styles.sass";
import Button from "@/common/components/Button/index.js";
import {faArrowRight, faBook} from "@fortawesome/free-solid-svg-icons";
import {useNavigate} from "react-router-dom";
import {DOCUMENTATION_BASE} from "@/main.jsx";

export const GetStarted = () => {
    const navigate = useNavigate();
    
    return (
        <section className="cta-section">
            <div className="cta-content">
                <h2>Ready to monitor your network?</h2>
                <p>Get started with MySpeed in just a few minutes. Free, open-source, and self-hosted.</p>
                
                <div className="cta-actions">
                    <Button 
                        text="Get Started" 
                        icon={faArrowRight} 
                        color="primary"
                        size="lg"
                        onClick={() => navigate("/install")} 
                    />
                    <Button 
                        text="Read the Docs" 
                        icon={faBook} 
                        color="primary"
                        variant="ghost"
                        size="lg"
                        onClick={() => window.open(DOCUMENTATION_BASE, "_blank")} 
                    />
                </div>
            </div>
            
            <div className="cta-decoration">
                <div className="glow-orb glow-1"/>
                <div className="glow-orb glow-2"/>
            </div>
        </section>
    );
}