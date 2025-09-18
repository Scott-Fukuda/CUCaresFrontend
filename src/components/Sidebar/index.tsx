import "./index.scss";
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../../types';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

interface SidebarProps {
    toggleSideBar: boolean;
    setToggleSideBar: React.Dispatch<React.SetStateAction<boolean>>;
    currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSideBar, setToggleSideBar, currentUser }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className={`sidebar ${toggleSideBar ? 'active' : ''}`}>
            <div className="header">
                <ArrowBackIosIcon 
                    style={{fill: "#cf1c25", cursor: "pointer", width: "20px"}}
                    onClick={() => setToggleSideBar(false)}
                />
                <img 
                    src="/logo.png" 
                    alt="CampusCares Logo" 
                    className="h-11 w-12 object-contain"
                />
            </div>
            <div className="nav">
                <div className={`nav-opt ${location.pathname === '/about-us' ? 'active' : ''}`}
                    onClick={() => {
                        setToggleSideBar(false);
                        navigate("/about-us");
                    }}>
                    <p>About Us</p>
                </div>
                <div className={`nav-opt ${location.pathname === '/my-opportunities' ? 'active' : ''}`}
                    onClick={() => {
                        setToggleSideBar(false);
                        navigate('/my-opportunities');
                    }}>
                    <p>My Opportunities</p>
                </div>
                {/* Admin page - only show for admin users */}
                {currentUser.admin && (
                    <div className="nav-opt" 
                        onClick={() => {
                            setToggleSideBar(false);
                            navigate('/admin');
                        }}>
                        <p>Admin Panel</p>
                    </div>
                )}
                <div className="nav-opt" onClick={() => window.location.href = "mailto:sdf72@cornell.edu?subject=Bug Report - Campus Cares Frontend&body=Please describe the bug you encountered:"}>
                    <p>Report Bug</p>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;