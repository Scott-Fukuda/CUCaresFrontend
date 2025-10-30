import "./index.scss";
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import { useNavigate } from 'react-router-dom';

interface WaiverPopupProps {
    showWaiverPopup: boolean,
    setShowWaiverPopup: React.Dispatch<React.SetStateAction<boolean>>
}

const WaiverPopup: React.FC<WaiverPopupProps> = ({
    showWaiverPopup,
    setShowWaiverPopup
}) => {

    if (!showWaiverPopup) return;

    const navigate = useNavigate();

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <CloseIcon className="close-icon" onClick={() => setShowWaiverPopup(false)} />
                <div className="modal-content">
                    <div className="attention">
                        <p>🚨 Important Update!</p>
                    </div>
                    <div className="popup-icon-header">
                        <DirectionsCarFilledIcon className="car-icon" />
                    </div>
                    <h3>Carpool Liability Waiver</h3>
                    <p className="modal-message">For everyone’s safety, we need all participants to review and sign our Carpool Liability Waiver before joining a ride to future events.</p>
                    <div className="modal-actions">
                        <button
                            className="red-btn"
                            onClick={() => {
                                setShowWaiverPopup(false);
                                navigate('/sign-waiver');
                            }}
                        >
                            Sign Waiver
                        </button>
                        <p onClick={() => setShowWaiverPopup(false)}>Maybe Later</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WaiverPopup;