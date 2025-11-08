// import './index.scss';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { User } from '../../types';
import { getCar, createOrUpdateCar, createRide } from '../../api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import './index.scss';

interface CarpoolFormPopupProps {
    setShowPopup: React.Dispatch<React.SetStateAction<boolean>>,
    currentUser: User,
    carpoolId: string,
    showPopup: (
        title: string,
        message: string,
        type: 'success' | 'info' | 'warning' | 'error'
    ) => void,
}

const CarpoolFormPopup: React.FC<CarpoolFormPopupProps> = ({
    setShowPopup,
    currentUser,
    carpoolId,
    showPopup
}) => {
    const navigate = useNavigate();
    const [carSeats, setCarSeats] = useState(currentUser.car_seats);
    const [color, setColor] = useState('');
    const [model, setModel] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [error, setError] = useState("");
    const queryClient = useQueryClient();

    const { data: carData, isLoading } = useQuery({
        queryKey: ['car', currentUser.id],
        queryFn: () => getCar(currentUser.id!.toString()),
        enabled: !!currentUser.id
    });

    useEffect(() => {
        if (!carData) return;

        if (carData.exists) {
            const car = carData.car;
            setColor(car.color ? car.color : '');
            setModel(car.model ? car.model : '');
            setLicensePlate(car.license_plate ? car.license_plate : '');
        }
    }, [carData])

    if (isLoading || !carData) return;

    const onSubmit = async () => {
        if (!carSeats) {
            setError('Number of car seats cannot be empty');
            return;
        }
        if (licensePlate && licensePlate.length != 4) {
            setError('License plate value should only be the last 4 characters');
            return;
        }

        try {
            await createOrUpdateCar({
                seats: carSeats,
                user_id: currentUser.id,
                color: color,
                model: model,
                license_plate: licensePlate
            });

            await createRide({
                carpool_id: carpoolId,
                driver_id: currentUser.id,
            });

            queryClient.invalidateQueries({ queryKey: ['rides', carpoolId] });
            setShowPopup(false);
            showPopup(
                'Ride Added!',
                'Thank you for signing up to drive! An email will be sent to you seven hours prior to the event with details about the carpool ride (including pickup locations, riders, etc.).',
                'success'
            );
        } catch (err) {
            console.log('Failed to add ride:', err);
            setError('Failed to add ride, please try again');
        }
    }

    return (
        <div className="carpool-popup">
            <div className="modal-backdrop">
                <div className="modal">
                    <CloseIcon className="close-icon" onClick={() => setShowPopup(false)} />
                    <div className="modal-content" style={{ gap: "20px" }}>
                        <h1>Add a Ride</h1>
                        <h3>{carSeats == 0 ? 'Please enter the details of your car' : 'Please confirm and adjust the details accordingly'}</h3>
                        <div className="carpool-form-content">
                            <div>
                                <label className="form-label" htmlFor="seats">
                                    Number of car seats *
                                </label>
                                <input
                                    className="form-field"
                                    id="seats"
                                    type="text"
                                    value={carSeats === 0 ? '' : carSeats}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '') {
                                            setCarSeats(0);
                                        } else {
                                            const numValue = parseInt(value);
                                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 15) {
                                                setCarSeats(numValue);
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <label className="form-label" htmlFor="color">
                                    Car color
                                </label>
                                <input
                                    className="form-field"
                                    id="color"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label" htmlFor="model">
                                    Car model
                                </label>
                                <input
                                    className="form-field"
                                    id="model"
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label" htmlFor="license-plate">
                                    Last 4 characters of license plate
                                </label>
                                <input
                                    className="form-field"
                                    id="license-plate"
                                    value={licensePlate}
                                    onChange={e => setLicensePlate(e.target.value)}
                                />
                            </div>
                        </div>
                        {error &&
                            <div className="error-text">
                                {error}
                            </div>
                        }
                        <p className="driver-warning">By signing up to drive, you’re committing to follow through. Please only continue if you’re sure you can drive.</p>
                        <button className="btn-red" onClick={onSubmit}>
                            Add Ride
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CarpoolFormPopup;