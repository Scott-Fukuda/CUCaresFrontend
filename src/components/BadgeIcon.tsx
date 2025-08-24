
import React, {useState} from 'react';
import { Badge } from '../types';

interface BadgeIconProps {
    badge: Badge;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ badge }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative flex flex-col items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="text-4xl bg-light-gray p-2 rounded-full cursor-pointer">
                {badge.icon}
            </div>
            {isHovered && (
                 <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-center text-xs rounded-lg py-2 px-3 z-10">
                    <p className="font-bold">{badge.name}</p>
                    <p>{badge.description}</p>
                    <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                        <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                    </svg>
                </div>
            )}
        </div>
    );
};

export default BadgeIcon;
