import "./index.scss";
import { PageState } from '../../App';
import { User } from '../../types';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

interface SidebarProps {
    toggleSideBar: boolean;
    setToggleSideBar: React.Dispatch<React.SetStateAction<boolean>>;
    setPageState: (page: PageState) => void;
    currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSideBar, setToggleSideBar, setPageState, currentUser }) => {

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
                <div className="nav-opt" 
                    onClick={() => {
                        setToggleSideBar(false);
                        setPageState({ page: 'aboutUs' });
                    }}>
                    <p>About Us</p>
                </div>
                <div className="nav-opt" 
                    onClick={() => {
                        setToggleSideBar(false);
                        setPageState({ page: 'myOpportunities' });
                    }}>
                    <p>My Opportunities</p>
                </div>
                {/* Admin page - only show for admin users */}
                {currentUser.admin && (
                    <div className="nav-opt" 
                        onClick={() => {
                            setToggleSideBar(false);
                            setPageState({ page: 'admin' });
                        }}>
                        <p>Admin Panel</p>
                    </div>
                )}
                <div className="nav-opt" onClick={() => window.location.href = "mailto:sdf72@cornell.edu?subject=Bug Report - CUCares Frontend&body=Please describe the bug you encountered:"}>
                    <p>Report Bug</p>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;