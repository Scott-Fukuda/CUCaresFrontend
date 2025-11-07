import './index.scss';
import CloseIcon from '@mui/icons-material/Close';
import CarpoolIcon from '../../assets/icons/carpool_icon.png';
import { useNavigate } from 'react-router-dom';

interface CarpoolPopupProps {
    opportunityId: number
    setShowPopup: React.Dispatch<React.SetStateAction<number | null>>
}

const CarpoolPopup: React.FC<CarpoolPopupProps> = ({
    setShowPopup,
    opportunityId
}) => {
    const navigate = useNavigate();

    return (
        <div className="carpool-popup">
            <div className="modal-backdrop">
                <div className="modal">
                    <CloseIcon className="close-icon" onClick={() => setShowPopup(null)} />
                    <div className="modal-content">
                        <div className="popup-icon-header">
                            <img src={CarpoolIcon} alt="carpool icon" className="carpool-icon" />
                        </div>
                        <h3>Carpool options are available for this opportunity!</h3>
                        {/* <p className="modal-message">Select whether you would like to get or give a ride.</p> */}
                        <div className="modal-actions">
                            <button
                                className="red-btn"
                                onClick={() => {
                                    setShowPopup(null);
                                    navigate(`/carpool/${opportunityId}`, {
                                        state: { mode: 'rider'}
                                    });
                                }}
                            >
                                <p><b>GET</b> a ride</p>
                            </button>
                            <button
                                className="red-btn"
                                onClick={() => {
                                    setShowPopup(null);
                                    navigate(`/carpool/${opportunityId}`, {
                                        state: { mode: 'driver'}
                                    });
                                }}
                            >
                                <p><b>GIVE</b> a ride</p>
                            </button>
                            <p style={{ paddingTop: "10px" }}>I have my own means of transportation</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CarpoolPopup;