import './index.scss';
import { useState } from "react";
import ErrorIcon from '@mui/icons-material/Error';
import { User } from '../../types';
import { createWaiver } from '../../api';
import { useNavigate, useLocation } from "react-router-dom";

interface WaiverProps {
    type: 'carpool' | 'org',
    currentUser: User,
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
}

const Waiver: React.FC<WaiverProps> = ({
    type,
    currentUser,
    setCurrentUser
}) => {
    const [name, setName] = useState("");
    const [consentChecked, setConsentChecked] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { opportunityId } = location.state;

    const carpool_waiver = `Waiver of Liability and Hold Harmless Transportation Agreement
I understand that CampusCares LLC rules require that participants provide transportation of themselves to all opportunities listed on the CampusCares website. While CampusCares may facilitate the mechanisms that allow for carpooling agreements to take place between participants, all liability falls onto the individuals operating vehicles, who subject themselves to liability in the transportation of fellow participants. 
In consideration for the executive team of CampusCares and the organization of CampusCares, I  acknowledge that during all current and subsequent travels to CampusCares, listed organizations that: 
1. I hereby release, waive, discharge and covenant not to sue CampusCares and its individual members, officers, agents, servants, or employees (hereinafter referred to as releasees) from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or any of the property belonging to me, as result of, or in any way arising out of my traveling to listed organizations in a vehicle or vehicles not owned or operated by the CampusCares.
I voluntarily assume full responsibility for any risks of loss.
I further hereby agree to indemnify and hold harmless the releasees from any
loss, liability, damage, or costs due to my child(ren) traveling to and or from a listed organization in a vehicle or vehicles not owned or operated by the District.
4. I hereby further agree that this Waiver of Liability and Hold Harmless Agreement shall be construed and enforced in accordance with the laws of the state of New York.
5. In signing this release, I acknowledge and represent that I have read the foregoing Waiver of Liability and Hold Harmless Agreement, understand it, and sign it voluntarily as my own free act and deed.`

    const handleSubmit = async () => {
        if (!name || name.replace(/\s+/g, "").toLowerCase() !== currentUser.name.replace(/\s+/g, "").toLowerCase()) {
            setError("You must enter your full name as registered on CampusCares");
            return;
        }
        if (!consentChecked) {
            setError("You must check the box above to consent to the terms of the waiver");
            return;
        }

        try {
            await createWaiver({
                typed_name: name,
                type: type,
                content: type == "carpool" ? carpool_waiver : "",
                checked_consent: consentChecked,
                user_id: currentUser.id
            });

            setCurrentUser(prev => prev ? ({...prev, carpool_waiver_signed: true}) : null);
            navigate(`/carpool/${opportunityId}`);
        } catch (err) {
            setError("Failed to submit waiver, please try again.");
        }
    }

    return (
        <div className="waiver">
            {type == "carpool" &&
                <div className="waiver-content">
                    <h2>Waiver of Liability and Hold Harmless Transportation Agreement</h2>
                    <p>I understand that CampusCares LLC rules require that participants provide transportation of themselves to all opportunities listed on the CampusCares website. While CampusCares may facilitate the mechanisms that allow for carpooling agreements to take place between participants, all liability falls onto the individuals operating vehicles, who subject themselves to liability in the transportation of fellow participants.</p>
                    <p>In consideration for the executive team of CampusCares and the organization of CampusCares, I  acknowledge that during all current and subsequent travels to CampusCares, listed organizations that: </p>
                    <ol className="list-decimal list-inside ml-6">
                        <li>I hereby release, waive, discharge and covenant not to sue CampusCares and its individual members, officers, agents, servants, or employees (hereinafter referred to as releasees) from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or any of the property belonging to me, as result of, or in any way arising out of my traveling to listed organizations in a vehicle or vehicles not owned or operated by the CampusCares.</li>
                        <li>I voluntarily assume full responsibility for any risks of loss.</li>
                        <li>I further hereby agree to indemnify and hold harmless the releasees from any loss, liability, damage, or costs due to my child(ren) traveling to and or from a listed organization in a vehicle or vehicles not owned or operated by the District.</li>
                        <li>I hereby further agree that this Waiver of Liability and Hold Harmless Agreement shall be construed and enforced in accordance with the laws of the state of New York.</li>
                        <li>In signing this release, I acknowledge and represent that I have read the foregoing Waiver of Liability and Hold Harmless Agreement, understand it, and sign it voluntarily as my own free act and deed.</li>
                    </ol>
                </div>
            }
            <div className="name-input-wrapper">
                <label htmlFor="name">Type your full name *</label>
                <input id="name"
                    type="text"
                    value={name}
                    onChange={e => {
                        setName(e.target.value);
                        setError("");
                    }}
                />
            </div>
            <div className="checkbox-wrapper">
                <input type="checkbox" id="consent" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} />
                <label htmlFor="consent">I have read and agree to the terms of the waiver and understand that this constitutes my electronic signature. *</label>
            </div>
            {error &&
                <div className="error-text">
                    <ErrorIcon className="error-icon" />
                    <p>{error}</p>
                </div>
            }
            <button className='btn-red' style={{ width: "40%" }} onClick={handleSubmit}>Submit</button>
        </div>
    )
}

export default Waiver;