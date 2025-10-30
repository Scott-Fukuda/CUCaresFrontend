import React, { useState, useMemo } from "react"; 
import { useNavigate } from "react-router-dom";
import { Opportunity } from "../types";

type CalendarProps = {
    opportunities: Opportunity[];
};

const Calendar: React.FC<CalendarProps> = ({ opportunities }) => {
    const navigate = useNavigate();
    
    const [current, setCurrent] = useState(new Date()); // if you never call setCurrent, then the value stays constant forever 

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
            const dayOpportunities = opportunities.filter(
                opp => {new Date(opp.date).toDateString() === date.toDateString() // compare whether the opportunity happened on the same day as the date we're processing 
            });
            days.push({ date: date, opps: dayOpportunities });
        }
        return days;
    }, [current, opportunities]);

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
        <div className="p-6">
  <h2 className="text-2xl font-semibold text-cornell-red mb-6">
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
      ← Prev
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
      Next →
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
        className={`h-24 rounded-2xl shadow-sm border flex flex-col p-2 
          ${
            isNaN(date.getTime())
              ? "bg-transparent border-none"
              : opps.length > 0
              ? "bg-cornell-red/10 hover:bg-cornell-red/20 border-cornell-red cursor-pointer transition"
              : "bg-white border-gray-200"
          }`}
        onClick={() =>
          !isNaN(date.getTime()) && opps.length > 0
            ? navigate(`/service-journal/day/${date.toISOString().split("T")[0]}`)
            : null
        }
      >
        {!isNaN(date.getTime()) && (
          <>
            <div className="text-right text-sm font-semibold text-gray-700">
              {date.getDate()}
            </div>
            {opps.length > 0 && (
              <div className="mt-auto">
                <span className="text-xs font-medium text-cornell-red">
                  {opps.length} event{opps.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    ))}
  </div>
</div>
    ); 
};

export default Calendar; 