import InterfaceImage from "@/common/assets/interface.png";
import "./styles.sass";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDown, faArrowUp, faArrowRight, faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import Features from "@/pages/Home/components/Features";
import FeatureGrid from "@/pages/Home/components/FeatureGrid";
import GetStarted from "@/pages/Home/components/GetStarted";
import Footer from "@/pages/Home/components/Footer";
import Button from "@/common/components/Button";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef} from "react";

const GITHUB_LINK = "https://github.com/gnmyt/myspeed";
const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

const chooseRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const randomPosition = () => Math.random() * 80 + 10; // 10-90%

export const Home = () => {
    const navigate = useNavigate();
    const imageRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!imageRef.current) return;

            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const progress = Math.min(scrollY / (windowHeight * 0.5), 1);

            const rotateX = 25 - (progress * 25);
            const scale = 0.75 + (progress * 0.35);
            const translateY = progress * -60;

            imageRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`;
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToContent = () => {
        window.scrollTo({top: window.innerHeight, behavior: 'smooth'});
    };

    return (
        <div className="home-page">
            <section className="hero">
                <div className="floating-icons">
                    {Array(12).fill(0).map((_, index) => (
                        <FontAwesomeIcon
                            key={index}
                            icon={index % 2 === 0 ? faArrowDown : faArrowUp}
                            className="floating-icon"
                            style={{
                                color: chooseRandomColor(),
                                left: `${randomPosition()}%`,
                                top: `${randomPosition()}%`,
                                animationDelay: `${index * 0.4}s`,
                                animationDuration: `${3 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                <div className="hero-content">
                    <h1 className="hero-title">MySpeed</h1>
                    <p className="hero-tagline">Speedtest automation made simple</p>
                    <p className="hero-description">
                        Monitor your internet connection 24/7 with automated speed tests.
                        Track download, upload, and ping over time - self-hosted and open source.
                    </p>

                    <div className="hero-actions">
                        <Button
                            text="Get Started"
                            icon={faArrowRight}
                            color="primary"
                            size="lg"
                            onClick={() => navigate("/install")}
                        />
                        <Button
                            text="View on GitHub"
                            icon={faGithub}
                            color="primary"
                            variant="outline"
                            size="lg"
                            onClick={() => window.open(GITHUB_LINK, "_blank")}
                        />
                    </div>
                </div>

                <div className="interface-preview">
                    <img ref={imageRef} src={InterfaceImage} alt="MySpeed Interface" draggable={false}/>
                </div>

                <button className="scroll-indicator" onClick={scrollToContent} aria-label="Scroll down">
                    <span>Scroll to explore</span>
                    <FontAwesomeIcon icon={faChevronDown}/>
                </button>
            </section>

            <Features/>
            <FeatureGrid/>
            <GetStarted/>
            <Footer/>
        </div>
    )
}