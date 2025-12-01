import React, { useState, useEffect, useMemo } from "react"; 
import { useNavigate } from "react-router-dom";
import { Opportunity, User } from "../types";
import { getOpportunities } from "../api";
import { Link } from "react-router-dom";


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

    const pastRegistered = useMemo(() => {
      const now = new Date();
      return opportunities.filter((opp) => {
        const oppDateTime = parseOppDateTime(opp);
        const isPast = oppDateTime < now;

        return (isPast &&
          opp.involved_users?.some(
            (user) => user.id === currentUser.id // check if the user id matchs the current user and the user attended field is true
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
const attendanceRate = totalSignedUp > 0 ? (pastOpportunities.length / pastRegistered.length) * 100 : 0;

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

function getWeekKey(dateString: string) {
  const d = new Date(dateString);

  // Normalize to midnight local time
  d.setHours(0, 0, 0, 0);

  const day = d.getDay(); // 0 = Sunday

  // Go back to the Sunday of that week
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);

  // Use ISO date as week identifier (YYYY-MM-DD)
  return sunday.toISOString().split("T")[0];
}

function computeWeeklyStreak(attendedDates: string[]) {
  if (attendedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const weekKeys = attendedDates.map(getWeekKey);
  const uniqueWeeks = [...new Set(weekKeys)]
    .map(key => new Date(key))
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueWeeks.length; i++) {
    const prev = uniqueWeeks[i - 1];
    const curr = uniqueWeeks[i];

    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (Math.round(diffDays) === 7) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  // Compute the current streak specifically up to THIS week's Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - day);

  let currentStreak = 0;
  let week = new Date(thisSunday);

  while (true) {
    const key = week.toISOString().split("T")[0];
    if (weekKeys.includes(key)) {
      currentStreak++;
      week.setDate(week.getDate() - 7); // step back 1 week
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak: longest };
}

const attendedDates = opportunities
  .filter(opp =>
    opp.involved_users?.some(
      (u) => u.id === currentUser.id && u.attended
    )
  )
  .map(opp => opp.date);

const { currentStreak, longestStreak } = computeWeeklyStreak(attendedDates);

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

{/* TITLE + STREAK BADGE */}
<div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold">Service Calendar</h2>

  {/* Duolingo-Style Streak Box */}
  <div className="flex items-center">

    {/* Current Streak Badge */}
    <div
      className="
        flex items-center gap-1 px-3 py-1
        font-semibold text-gray-800
      "
    >
      <span className="text-orange-600 text-xl">🔥</span>
      <span className="text-lg">{currentStreak}</span>
    </div>

{/* Longest Streak (two lines: "Your Longest" / "Streak: X weeks") */}
<div className="text-xs text-gray-600 leading-tight text-left ml-2">
  <div className="whitespace-nowrap font-medium">
    Your Longest
  </div>
  <div className="font-medium">
    Streak: {longestStreak} week{longestStreak !== 1 ? "s" : ""}
  </div>
</div>

  </div>
</div>

{/* Motivational message with POP animation */}
{currentStreak === 0 && (
  <div
    className="
      bg-yellow-50 border border-yellow-200 
      text-yellow-700 px-4 py-2 rounded-xl mb-4 
      text-sm font-medium flex items-center gap-2
    "
  >
    <span className="text-yellow-600 text-lg">✨</span>
    Start your service streak! Sign up for an opportunity this week.
  </div>
)}

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
      <Link
        to="/past-opportunities"
        className="mt-4 block text-xs text-gray-500 text-center hover:text-gray-700"
      >
        View All Attended Opportunities
      </Link>
    </div>
  </div>
);
};

export default Calendar;