import './index.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

const HomeHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobile } = useBreakpoint();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="homeheader-container">
            <div className="homeheader">
                <div className="left-nav">
                    <img
                        src="/logo.png"
                        alt="CampusCares Logo"
                        className="logo"
                        onClick={() => {
                            if (isMobile) navigate('/');
                        }}
                    />
                    {!isMobile &&
                        <div className="row">
                            <div
                                className={`nav-opt ${location.pathname === '/' ? 'active' : ''}`}
                                onClick={() => {
                                    navigate('/');
                                }}
                            >
                                Home
                            </div>
                            <div
                                className={`nav-opt ${location.pathname === '/about-us' ? 'active' : ''}`}
                                onClick={() => {
                                    navigate('/about-us');
                                }}
                            >
                                About Us
                            </div>
                            <div
                                className={`nav-opt ${location.pathname === '/explore' ? 'active' : ''}`}
                                onClick={() => {
                                    navigate('/explore');
                                }}
                            >
                                Explore
                            </div>
                        </div>
                    }
                </div>
                <div className="right-nav">
                    {isMobile ? (
                        menuOpen ? (
                            <CloseIcon className="mb-icon" onClick={() => setMenuOpen(false)} />
                        ) : (
                            <MenuIcon className="mb-icon" onClick={() => setMenuOpen(true)} />
                        )
                    ) : (
                        <div className="row">
                            <div
                                className={`nav-opt`}
                                onClick={() => {
                                    navigate('/login');
                                }}
                            >
                                Login
                            </div>
                            <div
                                className={`nav-opt btn`}
                                onClick={() => {
                                    navigate('/sign-up');
                                }}
                            >
                                Sign Up
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isMobile && menuOpen &&
                <div className="menu-wrapper">
                    <div className="menu-main">
                        <div
                            className={`mob-nav ${location.pathname === '/' ? 'active' : ''}`}
                            onClick={() => {
                                navigate('/');
                            }}
                        >
                            Home
                        </div>
                        <div
                            className={`mob-nav ${location.pathname === '/about-us' ? 'active' : ''}`}
                            onClick={() => {
                                navigate('/about-us');
                            }}
                        >
                            About Us
                        </div>
                        <div
                            className={`mob-nav ${location.pathname === '/explore' ? 'active' : ''}`}
                            onClick={() => {
                                navigate('/explore');
                            }}
                        >
                            Explore
                        </div>
                    </div>
                    <div className="menu-sub">
                        <div
                            className="sub-nav"
                            onClick={() => {
                                navigate('/login');
                            }}
                        >
                            Log in
                        </div>
                        <div
                            className="sub-nav"
                            onClick={() => {
                                navigate('/sign-up');
                            }}
                        >
                            Create Account
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default HomeHeader;