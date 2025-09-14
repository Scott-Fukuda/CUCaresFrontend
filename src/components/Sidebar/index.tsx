import "./index.scss";
import { PageState } from '../../App';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

interface SidebarProps {
    toggleSideBar: boolean;
    setToggleSideBar: React.Dispatch<React.SetStateAction<boolean>>;
    setPageState: (page: PageState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSideBar, setToggleSideBar, setPageState }) => {

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
                {/* <p>About Us</p> */}
                <div className="nav-opt" 
                    onClick={() => {
                        setToggleSideBar(false);
                        setPageState({ page: 'myOpportunities' });
                    }}>
                    <p>My Opportunities</p>
                </div>
                <div className="nav-opt" onClick={() => window.location.href = "mailto:scott@campuscares.us?subject=Bug Report - CUCares Frontend&body=Please describe the bug you encountered:"}>
                    <p>Report Bug</p>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;