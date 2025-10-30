import './index.scss';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState } from "react"
import CarpoolFormPopup from '../../components/CarpoolFormPopup';
import { useParams } from 'react-router-dom';
import { getOpportunity } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { Opportunity } from '../../types';
import { formatTimeUntilEvent, calculateEndTime } from '../../utils/timeUtils';

const CarpoolPage: React.FC = () => {
    const [showRiderForm, setShowRiderForm] = useState(false);

    const { id: opportunityId } = useParams();

    if (!opportunityId) return;

    const { data: opportunity, isLoading } = useQuery<Opportunity>({
        queryKey: ['opportunity', opportunityId],
        queryFn: () => getOpportunity(parseInt(opportunityId))
    })

    if (isLoading || !opportunity) return <p>Loading...</p>

    const dateObj = new Date(opportunity.date);
    dateObj.setDate(dateObj.getDate() + 1);

    const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', {
    //     hour: 'numeric',
    //     minute: '2-digit',
    //     hour12: true
    // });

    // const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);

    const onSelectRide = () => {
        setShowRiderForm(true);

    }

    return (
        <div className="carpool-page">
            <div className="carpool-header">
                <h1>Carpool for {opportunity.name}</h1>
                <div className="primary-details">
                    <p>11:00 AM - 2:00 PM | {displayDate}</p>
                </div>
                {opportunity.address &&
                    <div className="location">
                        <LocationOnIcon />
                        <p>{opportunity.address}</p>
                    </div>
                }
                <div className="deadline-alert">
                    <p>Sign ups close at 6 AM, {displayDate}</p>
                </div>
            </div>
            <div className="cp-content">
                <div className="cp-card">
                    <div className="cp-card-header">
                        <DirectionsCarFilledIcon className="cp-car-icon" />
                        <div className="cp-card-header-text">
                            <h2>John Smith</h2>
                            {/* WRITE DRIVERS NAME SOMEWHERE */}
                            <div className="cp-card-riders">
                                <div className="cp-card-slots">
                                    <div className="cp-card-slot">
                                        <img src={"https://images.unsplash.com/photo-1760624876412-e6d69fb8ff8e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035"} />
                                    </div>
                                    <div className="cp-card-slot" style={{ borderColor: "lightgrey" }}>
                                    </div>
                                    <div className="cp-card-slot" style={{ borderColor: "lightgrey" }}>
                                    </div>
                                    <div className="cp-card-slot" style={{ borderColor: "lightgrey" }}>
                                    </div>
                                </div>
                                <p>3 Seats Available</p>
                            </div>
                        </div>
                    </div>
                    <button className="btn-red" onClick={onSelectRide}>Join Ride</button>
                </div>
                <div className="cp-card">
                    <div className="cp-card-header">
                        <DirectionsCarFilledIcon className="cp-car-icon" />
                        <div className="cp-card-header-text">
                            <h2>John Smith</h2>
                            {/* WRITE DRIVERS NAME SOMEWHERE */}
                            <div className="cp-card-riders">
                                <div className="cp-card-slots">
                                    <div className="cp-card-slot">
                                        <img src={"https://images.unsplash.com/photo-1760624876412-e6d69fb8ff8e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035"} />
                                    </div>
                                    <div className="cp-card-slot" style={{ borderColor: "lightgrey" }}>
                                    </div>
                                    <div className="cp-card-slot" style={{ borderColor: "lightgrey" }}>
                                    </div>
                                    <div className="cp-card-slot" style={{ borderColor: "lightgrey" }}>
                                    </div>
                                </div>
                                <p>3 Seats Available</p>
                            </div>
                        </div>
                    </div>
                    <button className="btn-red" onClick={onSelectRide}>Join Ride</button>
                </div>

                <div className="cp-add">
                    <button className="btn-orange">
                        + Add Ride
                    </button>
                </div>
            </div>


            {showRiderForm &&
                <CarpoolFormPopup
                    setShowPopup={setShowRiderForm}
                    header={"Carpool Information"}
                />
            }
        </div>
    )
};

export default CarpoolPage;