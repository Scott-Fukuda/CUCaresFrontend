import "./index.scss";
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import { useNavigate } from 'react-router-dom';

interface WaiverPopupProps {
    showWaiverPopup: boolean,
    setShowWaiverPopup: React.Dispatch<React.SetStateAction<boolean>>,
    opportunityId: string
}

const WaiverPopup: React.FC<WaiverPopupProps> = ({
    showWaiverPopup,
    setShowWaiverPopup,
    opportunityId
}) => {

    if (!showWaiverPopup) return;

    const navigate = useNavigate();

    return (
        <div className="modal-backdrop">
            <div className="modal">
                {/* <CloseIcon className="close-icon" onClick={() => setShowWaiverPopup(false)} /> */}
                <div className="modal-content">
                    {/* <div className="attention">
                        <p>🚨 Important Update!</p>
                    </div> */}
                    <div className="popup-icon-header">
                        <DirectionsCarFilledIcon className="car-icon" />
                    </div>
                    <h3>Carpool Liability Waiver</h3>
                    <p className="modal-message">For everyone’s safety, we need all participants to review and sign our Carpool Liability Waiver before joining a ride or driving others to events.</p>
                    <div className="modal-actions">
                        <button
                            className="red-btn"
                            onClick={() => {
                                setShowWaiverPopup(false);
                                navigate('/sign-waiver', {
                                    state: {
                                        opportunityId: opportunityId
                                    }
                                });
                            }}
                        >
                            Sign Waiver
                        </button>
                        <p onClick={() => {
                            setShowWaiverPopup(false);
                            navigate('/opportunities');
                        }}>
                            No thanks, I'll join a carpool later
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WaiverPopup;