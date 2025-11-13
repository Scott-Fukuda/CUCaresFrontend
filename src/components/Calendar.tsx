import React, { useState, useEffect, useMemo } from "react"; 
import { useNavigate } from "react-router-dom";
import { Opportunity, User } from "../types";
import { getOpportunities } from "../api";

type CalendarProps = {
    currentUser: User; 
};

const Calendar: React.FC<{currentUser: User}> = ({
  currentUser,
}) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const navigate = useNavigate()
    
    useEffect(() => {
    const fetchAll = async () => {
      const all = await getOpportunities();
      setOpportunities(all);
    };
    fetchAll();
  }, []);
    
    const [current, setCurrent] = useState(new Date()); // if you never call setCurrent, then the value stays constant forever 

    // helper: parse an opportunity's date+time into a local Date
    const parseOppDateTime = (opp: Opportunity) => {
      // prefer opp.time when available; fallback to "00:00"
      const time = opp.time || "00:00";
      // Build an ISO string with time to ensure Date treats it as local datetime
      // Note: "YYYY-MM-DDTHH:MM:SS" without timezone is treated as local time in modern browsers.
      return new Date(`${opp.date}T${time}`);
    };

    const pastOpportunities = useMemo(() => {
      const now = new Date();
      return opportunities.filter((opp) => {
        const oppDateTime = parseOppDateTime(opp);
        const isPast = oppDateTime < now;

        return (isPast &&
          opp.involved_users?.some(
            (user) => user.id === currentUser.id && user.attended // check if the user id matchs the current user and the user attended field is true
          )
        ); 
      });
    }, [opportunities, currentUser.id, current]);
  
    const calendarDays = useMemo(() => {
        const year = current.getFullYear();
        const month = current.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const numDays = new Date(year, month + 1, 0).getDate();

        const days: { date: Date; opps: Opportunity[]}[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) { // i starts at 0 because getDay() returns 0 for Sunday
            days.push({ date: new Date(NaN), opps: [] }); 
        }

        for (let day = 1; day <= numDays; day++) {
            const date = new Date(year, month, day);

            const dayOpportunities = pastOpportunities.filter((opp) => {
              const oppDateTime = parseOppDateTime(opp);
              return oppDateTime.toDateString() === date.toDateString() // compare whether the opportunity happened on the same day as the date we're processing 
        });
            days.push({ date: date, opps: dayOpportunities });
        }
        return days;
    }, [current, pastOpportunities]);

    const prevMonth = () => {
        setCurrent(
            new Date(current.getFullYear(), current.getMonth() - 1, 1)
        );
    };

    const nextMonth = () => {
        setCurrent(
            new Date(current.getFullYear(), current.getMonth() + 1, 1) // constructor arguments of Date are year, month (0-indexed), day, hour, etc. (arguments day onwards can be omitted and they will be written to their lowest possible values)
        );
    };
    
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg p-4 mt-6">
  <h2 className="text-xl font-bold mb-4">
    Service Journal Calendar
  </h2>

  {/* Month navigation */}
  <div className="flex justify-between items-center mb-4">
    <button
      onClick={() =>
        setCurrent(
          new Date(current.getFullYear(), current.getMonth() - 1, 1)
        )
      }
      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
    >
      ← 
    </button>
    <h3 className="text-lg font-medium">
      {current.toLocaleString("default", { month: "long" })} {current.getFullYear()}
    </h3>
    <button
      onClick={() =>
        setCurrent(
          new Date(current.getFullYear(), current.getMonth() + 1, 1)
        )
      }
      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
    >
       →
    </button>
  </div>

  {/* Calendar grid */}
  <div className="grid grid-cols-7 text-center font-medium border-b border-gray-300 pb-2 mb-2">
    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
      <div key={d} className="text-gray-700 uppercase text-sm tracking-wide">
        {d}
      </div>
    ))}
  </div>

  <div className="grid grid-cols-7 gap-2">
    {calendarDays.map(({ date, opps }, idx) => (
      <div
        key={idx}
className={`
        h-12 rounded-2xl shadow-sm flex flex-col p-2
        ${isNaN(date.getTime()) ? "bg-transparent border-none" : ""}
        ${!isNaN(date.getTime()) ? "border" : ""}
        ${opps.length > 0 || date.toDateString() === new Date().toDateString() ? "bg-cornell-red/10 border-cornell-red" : "bg-white border-gray-200"}
        ${opps.length > 0 ? "hover:bg-cornell-red/20 cursor-pointer transition" : ""}
      `}
        onClick={() => {
        if (!isNaN(date.getTime()) && opps.length > 0) {
          const localDateStr = date.toLocaleDateString("en-CA"); 
          navigate(`/service-journal/day/${localDateStr}`);
        }
      }}
      >
         {!isNaN(date.getTime()) && (
          <>
          <div className={`text-right text-sm font-semibold ${
            date.toDateString() === new Date().toDateString()
            ? "text-cornell-red"
            : "text-gray-700"
      }`}>
        {date.getDate()}
      </div>
    </>
  )}
  </div>
))}
</div>
</div>
); 
};

export default Calendar; 