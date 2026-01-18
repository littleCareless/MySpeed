import {Link} from "react-router-dom";
import "./styles.sass";
import Logo from "@/common/assets/logo192.png";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {DOCUMENTATION_BASE} from "@/main.jsx";

const GITHUB_LINK = "https://github.com/gnmyt/myspeed";

export const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <img src={Logo} alt="MySpeed"/>
                        <span>MySpeed</span>
                    </Link>
                    <p>Open-source speed test automation for your network.</p>
                </div>
                
                <div className="footer-links">
                    <div className="footer-column">
                        <h4>Product</h4>
                        <Link to="/install">Install</Link>
                        <Link to="/tutorials">Tutorials</Link>
                        <a href={DOCUMENTATION_BASE} target="_blank" rel="noopener noreferrer">Documentation</a>
                    </div>
                    
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <Link to="/imprint">Imprint</Link>
                        <Link to="/privacy">Privacy Policy</Link>
                    </div>
                    
                    <div className="footer-column">
                        <h4>Connect</h4>
                        <a href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faGithub}/> GitHub
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} Mathias Wagner. All rights reserved.</p>
            </div>
        </footer>
    )
}