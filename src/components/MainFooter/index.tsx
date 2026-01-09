import './index.scss';
import logoBanner from '../../assets/images/logo-banner.png';
import instagramLogo from '../../assets/icons/instagram.svg';
import linkedinLogo from '../../assets/icons/linkedin.svg';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const MainFooter = () => {
    const { isMobile } = useBreakpoint();

    return (
        <div className="footer">
            {isMobile &&
                <div className="socials">
                    <a href="https://www.instagram.com/campuscares.us/" target="_blank" rel="noopener noreferrer">
                        <img src={instagramLogo} />
                    </a>
                    <a href="https://www.linkedin.com/company/campus-cares" target="_blank" rel="noopener noreferrer">
                        <img src={linkedinLogo} />
                    </a>
                </div>
            }
            <div className="logo-wrapper">
                <img src={logoBanner} />
                {isMobile &&
                    <div className="sub-links">
                        <a
                            href="/terms_of_service.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-700"
                        >
                            Terms of Service
                        </a>
                    </div>
                }
                <p>© 2026 CampusCares. All rights reserved.</p>
            </div>
            {!isMobile &&
                <div className="links">
                    <div className="socials">
                        <a href="https://www.instagram.com/campuscares.us/" target="_blank" rel="noopener noreferrer">
                            <img src={instagramLogo} />
                        </a>
                        <a href="https://www.linkedin.com/company/campus-cares" target="_blank" rel="noopener noreferrer">
                            <img src={linkedinLogo} />
                        </a>
                    </div>
                    <div className="sub-links">
                        <a
                            href="/terms_of_service.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-700"
                        >
                            Terms of Service
                        </a>
                    </div>
                </div>
            }
        </div>
    )
}

export default MainFooter;