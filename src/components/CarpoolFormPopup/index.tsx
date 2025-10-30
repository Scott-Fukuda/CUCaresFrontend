import './index.scss';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface CarpoolFormPopupProps {
    setShowPopup: React.Dispatch<React.SetStateAction<boolean>>,
    header: string
}

const CarpoolFormPopup: React.FC<CarpoolFormPopupProps> = ({
    setShowPopup,
    header
}) => {
    const navigate = useNavigate();
    const [loc, setLoc] = useState("");
    const [otherLoc, setOtherLoc] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const locationOptions = ["RPCC", "Baker Flagpole", "CTB", "Other"];

    const onSubmit = () => {
        if (loc == "Other" && !otherLoc) {
            setError("Please specify at what location you would like to be picked up");
            return;
        }
    }

    return (
        <div className="carpool-popup">
            <div className="modal-backdrop">
                <div className="modal">
                    <CloseIcon className="close-icon" onClick={() => setShowPopup(false)} />
                    <div className="modal-content" style={{ gap: "20px" }}>
                        <h1>{header}</h1>
                        <div className="carpool-form-content">
                            <div>
                                <label className="form-label" htmlFor="loc">
                                    Where would you like to be picked up from? *
                                </label>
                                <select
                                    className="form-field"
                                    value={loc}
                                    onChange={(e) => setLoc(e.target.value)}
                                    id="loc"
                                >
                                    {locationOptions.map(choice => (
                                        <option key={choice}>{choice}</option>
                                    ))}
                                </select>
                            </div>
                            {loc == "Other" &&
                                <div>
                                    <label className="form-label" htmlFor="other-loc">
                                        Please specify Other *
                                    </label>
                                    <input
                                        className="form-field"
                                        id="other-loc"
                                        value={otherLoc}
                                        onChange={e => setOtherLoc(e.target.value)}
                                    />
                                </div>
                            }

                            <div>
                                <label className="form-label" htmlFor="notes">
                                    Any notes for the driver?
                                </label>
                                <input
                                    className="form-field"
                                    id="notes"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        {error &&
                            <div className="error-text">
                                {error}
                            </div>
                        }
                        <button className="btn-red" onClick={onSubmit}>
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CarpoolFormPopup;