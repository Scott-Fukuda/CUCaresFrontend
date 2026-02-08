import './index.scss';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState, useMemo, useEffect } from "react"
import CarpoolFormPopup from '../../components/CarpoolFormPopup';
import DriverFormPopup from '../../components/DriverFormPopup';
import WaiverPopup from '../../components/WaiverPopup';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getOpportunity, getRides, getProfilePictureUrl, removeRider } from '../../api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Opportunity, User, Ride } from '../../types';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { formatTimeUntilEvent, calculateEndTime, canUnregisterFromOpportunity } from '../../utils/timeUtils';
import { Tooltip } from 'react-tooltip';

interface CarpoolPageProps {
    currentUser: User;
    showPopup: (
        title: string,
        message: string,
        type: 'success' | 'info' | 'warning' | 'error'
    ) => void,
}

const CarpoolPage: React.FC<CarpoolPageProps> = ({ currentUser, showPopup }) => {
    const [showRiderForm, setShowRiderForm] = useState(false);
    const [selectedRideId, setSelectedRideId] = useState('');
    const [showWaiverPopup, setShowWaiverPopup] = useState<boolean>(!currentUser.carpool_waiver_signed);
    const { id: opportunityId } = useParams();
    const location = useLocation();
    const { mode } = location.state || {};
    const queryClient = useQueryClient();
    const [showDriverPopup, setShowDriverPopup] = useState<boolean>(
        !!(currentUser?.carpool_waiver_signed && mode === 'driver')
    );
    const navigate = useNavigate();

    const { data: opportunity, isLoading } = useQuery<Opportunity>({
        queryKey: ['opportunity', opportunityId],
        queryFn: () => getOpportunity(parseInt(opportunityId!)),
        enabled: !!opportunityId
    });

    const carpoolId = opportunity?.carpool_id;

    const { data: rides, isLoading: ridesLoading } = useQuery<Ride[]>({
        queryKey: ['rides', carpoolId],
        queryFn: () => getRides(parseInt(carpoolId!)),
        enabled: !!carpoolId,
        refetchInterval: 30000
    });


    const unregistrationCheck = useMemo(() => {
        if (!opportunity) return;
        return canUnregisterFromOpportunity(opportunity.date, opportunity.time);
    }, [opportunity?.date, opportunity?.time]);


    if (!opportunityId || !carpoolId) return null;

    if (isLoading || !opportunity || ridesLoading || !rides) return <p>Loading...</p>

    const canUnregister = unregistrationCheck?.canUnregister ?? true;
    const isDriver = rides.some(ride => ride.driver_id == currentUser.id.toString());
    const userRide = rides.find(ride => ride.riders.some(rider => rider.user_id == currentUser.id.toString()));
    const isRider = !!userRide;


    // Logic to get the time/date
    const dateObj = new Date(opportunity.date);
    dateObj.setDate(dateObj.getDate() + 1);

    const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);


    const onSelectRide = async (id: string) => {
        if (isRider && userRide.id == id) {
            try {
                await removeRider({
                    user_id: currentUser.id,
                    ride_id: id
                });
                queryClient.invalidateQueries({ queryKey: ['rides', carpoolId] });
            } catch (err) {
            }
        } else {
            setSelectedRideId(id);
            setShowRiderForm(true);
        }
    };

    const onAddRide = () => {
        setShowDriverPopup(true);
    }

    return (
        <div className="carpool-page">
            <Tooltip id="rider-tooltip" className="small-tooltip" />
            <button className="back-btn" onClick={() => navigate(`/opportunity/${opportunityId}`)}>
                <ArrowBackIosIcon style={{ fontSize: "14px" }} />
                <p>Back to Opportunity Details</p>
            </button>
            <div className="carpool-header">
                <h1>Carpool for {opportunity.name}</h1>
                <div className="primary-details">
                    <p>{displayTime} - {displayEndTime} | {displayDate}</p>
                </div>
                {opportunity.address &&
                    <div className="location">
                        <LocationOnIcon />
                        <p>{opportunity.address}</p>
                    </div>
                }
                {!canUnregister &&
                    <div className="deadline-alert">
                        <p>⚠ Carpool rides are now closed</p>
                    </div>
                }
            </div>
            <div className="cp-content">
                {rides.map(ride => {
                    const seatsLeft = ride.driver_seats - ride.riders.length;
                    const totalSlots = [...ride.riders, ...Array.from({ length: seatsLeft })];
                    const shownSlots = totalSlots.slice(0, 6);
                    const extraCount = totalSlots.length - shownSlots.length;
                    return (
                        <div className="cp-card" key={ride.id}>
                            <div className="cp-card-header">
                                <DirectionsCarFilledIcon className="cp-car-icon" />
                                <div className="cp-card-header-text">
                                    <h2>{ride.driver_name}</h2>
                                    <div className="cp-card-riders">
                                        <div className="cp-card-slots">
                                            {shownSlots.map((slot, i) => {
                                                if (i < ride.riders.length) {
                                                    const rider = ride.riders[i];
                                                    return (
                                                        <a
                                                            data-tooltip-id="rider-tooltip"
                                                            data-tooltip-content={rider.name}
                                                            key={rider.id}
                                                        >
                                                            <div className="cp-card-slot">
                                                                <img src={getProfilePictureUrl(rider.profile_image)} alt={`${rider.name} pfp`} />
                                                            </div>
                                                        </a>
                                                    )
                                                } else {
                                                    return (
                                                        <div
                                                            className="cp-card-slot"
                                                            key={`empty-${i}`}
                                                            style={{ borderColor: "lightgrey" }}
                                                        />
                                                    );
                                                }
                                            })}
                                            {extraCount > 0 && (
                                                <div className="cp-card-more">
                                                    +{extraCount}
                                                </div>
                                            )}
                                            {/* {Array.from({ length: seatsLeft }).map((_, i) =>
                                                <div className="cp-card-slot" key={`empty-${i}`} style={{ borderColor: "lightgrey" }} />
                                            )} */}
                                        </div>
                                        <p>{seatsLeft} Seat{seatsLeft == 1 ? '' : 's'} Available</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn-red"
                                onClick={() => onSelectRide(ride.id)}
                                disabled={seatsLeft == 0 && (!isRider || (isRider && !(userRide.id == ride.id))) || isDriver || (isRider && !(userRide.id == ride.id)) || !canUnregister ? true : false}
                            >
                                {isRider && userRide.id == ride.id ? 'Ride Joined ✓' : 'Join Ride'}
                            </button>
                        </div>
                    )
                })}

                <div className="cp-add">
                    <button className="btn-orange" disabled={!canUnregister || isDriver || isRider ? true : false} onClick={onAddRide}>
                        + Add Ride
                    </button>
                </div>
            </div>

            {showRiderForm &&
                <CarpoolFormPopup
                    setShowPopup={setShowRiderForm}
                    selectedRideId={selectedRideId}
                    currentUser={currentUser}
                    showPopup={showPopup}
                    carpoolId={carpoolId}
                />
            }

            {showDriverPopup && opportunity.carpool_id &&
                <DriverFormPopup
                    setShowPopup={setShowDriverPopup}
                    currentUser={currentUser}
                    carpoolId={opportunity.carpool_id}
                    showPopup={showPopup}
                />
            }

            {showWaiverPopup &&
                <WaiverPopup
                    showWaiverPopup={showWaiverPopup}
                    setShowWaiverPopup={setShowWaiverPopup}
                    opportunityId={opportunityId}
                />
            }
        </div>
    )
};

export default CarpoolPage;