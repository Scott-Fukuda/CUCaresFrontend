import React, { useState, useEffect, useMemo } from "react"; 
import { useNavigate } from "react-router-dom";
import { Opportunity, User } from "../types";
import { getOpportunities } from "../api";

type CalendarProps = {
    currentUser: User;
};

const Calendar: React.FC<{
  currentUser: User
}> = ({
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

{/*Stats*/}
// 1. All signups for this user
const totalSignedUp = opportunities.filter(
  (opp) => opp.involved_users?.some((u) => u.id === currentUser.id)
).length;

// 2. Total attended opportunities
const totalAttended = pastOpportunities.length;

// 3. Total hours served (only count attended)
const hoursVolunteered = ((currentUser.points || 0) / 60).toFixed(1)

// 4. Attendance rate
const attendanceRate = totalSignedUp > 0 ? (pastOpportunities.length / totalSignedUp) * 100 : 0;

{/*Stats In the Last 4 Weeks*/}
const now = new Date();
const fourWeeksAgo = new Date();
fourWeeksAgo.setDate(now.getDate() - 28); // 28 days ago ≈ 4 weeks

// Filter opportunities in the last 4 weeks
const lastFourWeeksOpportunities = pastOpportunities.filter(opp => {
  const oppDate = parseOppDateTime(opp);
  return oppDate >= fourWeeksAgo && oppDate <= now;
});

// Service opps per week
const serviceOppsPerWeek = Math.round(lastFourWeeksOpportunities.length / 4);

// Avg hours per week
const totalPointsLast4Weeks = lastFourWeeksOpportunities.reduce((sum, opp) => sum + (opp.points || 0), 0);
const hoursLast4Weeks = parseFloat((totalPointsLast4Weeks / 60).toFixed(1));
const avgHoursPerWeek = parseFloat((hoursLast4Weeks / 4).toFixed(1));

  {/*Calendar*/}
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
  <div className="space-y-6">  
    {/* Stats */}
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">All-Time Service Stats</h2>

      <div className="grid grid-cols-3 gap-4 justify-items-center">
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-2xl font-semibold">{totalAttended}</p>
          <p className="text-sm text-gray-600">Opportunities Attended</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-2xl font-semibold">{hoursVolunteered}</p>
          <p className="text-sm text-gray-600">Hours Served</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-2xl font-semibold">
            {attendanceRate.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-600">Attendance Rate</p>
        </div>
      </div>
    </div>

{/* Last Month Stats */}
    <div className="bg-white p-6 rounded-2xl shadow-lg">
  <h2 className="text-xl font-bold mb-4">Last Four Weeks</h2>

  <div className="grid grid-cols-2 gap-4 justify-items-center">
    <div className="p-4 bg-gray-50 rounded-xl text-center">
      <p className="text-2xl font-semibold">{serviceOppsPerWeek}</p>
      <p className="text-sm text-gray-600">Opportunities / Week</p>
    </div>

    <div className="p-4 bg-gray-50 rounded-xl text-center">
      <p className="text-2xl font-semibold">{avgHoursPerWeek.toFixed(1)}</p>
      <p className="text-sm text-gray-600">Hours / Week</p>
    </div>
  </div>
</div>

    {/* Calendar */}
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Service Calendar</h2>

      {/* Month navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
        >
          ←
        </button>

        <h3 className="text-lg font-medium">
          {current.toLocaleString("default", { month: "long" })}{" "}
          {current.getFullYear()}
        </h3>

        <button
          onClick={nextMonth}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
        >
          →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center font-medium border-b border-gray-300 pb-2 mb-2">
        {weekDays.map((d) => (
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
              ${opps.length > 0 || date.toDateString() === new Date().toDateString()
                ? "bg-cornell-red/10 border-cornell-red"
                : "bg-white border-gray-200"}
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
              <div
                className={`text-right text-sm font-semibold ${
                  date.toDateString() === new Date().toDateString()
                    ? "text-cornell-red"
                    : "text-gray-700"
                }`}
              >
                {date.getDate()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

export default Calendar; 