import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

 

export default function Reports({ goBack }) {

    // State Variables
    const [totalHabits, setTotalHabits] = useState(0);
    const [completedToday, setCompletedToday] = useState(0);
    const [streak, setStreak] = useState(0);
    const [weeklyData, setWeeklyData] = useState([]);

    const [weekOffset, setWeekOffset] = useState(0);
    const [weekRange, setWeekRange] = useState("");
    
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [minDate, setMinDate] = useState("");
    const [history, setHistory] = useState([]);
    const [historyPercent, setHistoryPercent] = useState(0);

    const [scheduleHistory, setScheduleHistory] = useState([]);
    
    const [schedulePercent, setSchedulePercent] = useState(0);
    const [completedSchedules, setCompletedSchedules] = useState(0);
    const [totalSchedules, setTotalSchedules] = useState(0);

    const [monthPercent, setMonthPercent] = useState(0);
    const [completedMonth, setCompletedMonth] = useState(0);
    const [missedMonth, setMissedMonth] = useState(0);
    const [monthName, setMonthName] = useState("");

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarLogs, setCalendarLogs] = useState([]);

  
    useEffect(() => {
        loadAnalytics();
        loadHistory();
        loadMonthStats();
        loadCalendar();
    }, [selectedDate, currentMonth, weekOffset]);

    async function loadAnalytics() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const today = selectedDate;

        // Total habits
        const { count: total } = await supabase
            .from("habits")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

        // Completed today
        const { count: completed } = await supabase
            .from("habit_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("log_date", today)
            .eq("completed", true);

        setTotalHabits(total || 0);

        if ((total || 0) === 0) {
            setCompletedToday(0);
        } else {
            setCompletedToday(Math.round(((completed || 0) / total) * 100));
        }

        // ----- STREAK -----
        const { data: logs } = await supabase
            .from("habit_logs")
            .select("log_date")
            .eq("user_id", user.id)
            .eq("completed", true)
            .order("log_date", { ascending: false });

        const uniqueDays = [...new Set(logs?.map(l => l.log_date) || [])];

        let current = 0;
        let date = new Date(selectedDate);


        while (true) {
            const day = date.toISOString().split("T")[0];

            if (uniqueDays.includes(day)) {
            current++;
            date.setDate(date.getDate() - 1);
            } else {
            break;
            }
        }

        setStreak(current);

        
        // ----- WEEKLY DATA (Percentage) -----

        const weekStart = new Date();
            weekStart.setDate(
            weekStart.getDate() - weekStart.getDay() + weekOffset * 7
            );

            const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                setWeekRange(
                `${weekStart.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                })} - ${weekEnd.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                })}`
            );

            const result = [];

            for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);

            const dateStr = dayDate.toISOString().split("T")[0];

            const { count: completedCount } = await supabase
                .from("habit_logs")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("log_date", dateStr)
                .eq("completed", true);

            const percent =
                (total || 0) === 0
                ? 0
                : Math.round(((completedCount || 0) / total) * 100);

            result.push({
                day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayDate.getDay()],
                percent,
                date: dateStr,
            });
        }

        setWeeklyData(result);



    }   // loadAnalytics ends  

        // ===== LOAD HISTORY =====
        async function loadHistory() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            // Registration date
            const registered = user.created_at.split("T")[0];
            setMinDate(registered);

            // Selected day's habits
            const { data } = await supabase
                .from("habit_logs")
                .select(`
                completed,
                habits (
                    name,
                    category
                )
                `)
                .eq("user_id", user.id)
                .eq("log_date", selectedDate);

            const { data: schedules } = await supabase
                .from("schedule_logs")
                .select(`
                    completed,
                    schedules (
                    activity,
                    start_time,
                    end_time
                    )
                `)
                .eq("user_id", user.id)
                .eq("log_date", selectedDate);

                
                const sortedSchedules = (schedules || []).sort((a, b) =>
                    (a.schedules?.start_time || "").localeCompare(
                        b.schedules?.start_time || ""
                    )
                );

                setScheduleHistory(sortedSchedules);

                const totalScheduleCount = sortedSchedules.length;
                const completedScheduleCount = sortedSchedules.filter(
                (s) => s.completed
                ).length;

                setTotalSchedules(totalScheduleCount);
                setCompletedSchedules(completedScheduleCount);

                setSchedulePercent(
                totalScheduleCount === 0
                    ? 0
                    : Math.round((completedScheduleCount / totalScheduleCount) * 100)
                );

                // Schedule statistics
                const scheduleCompleted =
                    sortedSchedules.filter((s) => s.completed).length;

                const scheduleTotal = sortedSchedules.length;

                setCompletedSchedules(scheduleCompleted);
                setTotalSchedules(scheduleTotal);
                setSchedulePercent(
                    scheduleTotal === 0
                        ? 0
                        : Math.round((scheduleCompleted / scheduleTotal) * 100)
                    );

                // Habit statistics
                const completed =
                    data?.filter((h) => h.completed).length || 0;

                const total = data?.length || 0;
                setHistoryPercent(
                    total === 0 ? 0 : Math.round((completed / total) * 100)
                );

                setHistory(data || []);
        }


        // ===== LOAD MONTH STATS =====
        async function loadMonthStats() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            const firstDay = new Date(year, month, 1)
                .toISOString()
                .split("T")[0];

            const lastDay = new Date(year, month + 1, 0)
                .toISOString()
                .split("T")[0];

            setMonthName(
                currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
                })
            );

            const { data } = await supabase
                .from("habit_logs")
                .select("completed")
                .eq("user_id", user.id)
                .gte("log_date", firstDay)
                .lte("log_date", lastDay);

            const total = data?.length || 0;
            const completed = data?.filter(h => h.completed).length || 0;

            setCompletedMonth(completed);
            setMissedMonth(total - completed);

            setMonthPercent(
                total === 0 ? 0 : Math.round((completed / total) * 100)
            );
        }


        // ===== LOAD CALENDAR =====
        async function loadCalendar() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const first = new Date(year, month, 1)
            .toISOString()
            .split("T")[0];

        const last = new Date(year, month + 1, 0)
            .toISOString()
            .split("T")[0];

        const { data } = await supabase
            .from("habit_logs")
            .select("log_date, completed")
            .eq("user_id", user.id)
            .gte("log_date", first)
            .lte("log_date", last);

        setCalendarLogs(data || []);
    }
 

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const completedDates = [...new Set(
    calendarLogs
        .filter(log => log.completed)
        .map(log => log.log_date)
    )];

  return (
    <div className="container py-5 page-enter">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 className="fw-bold mb-1" style={{fontSize:1}}><i className="fas fa-chart-line me-2 text-primary"></i> Reports & Analytics</h2>
            <p className="text-secondary mb-0">
            Track consistency, history & monthly progress
            </p>
        </div>

        <button className="btn glass px-4" onClick={goBack}>
            <i className="fas fa-arrow-left me-2"></i>Dashboard
        </button>
        </div>

        {/* Date Picker */}
        <div className="glass p-4 mb-4">
        <div className="row align-items-end g-3">

            <div className="col-md-6">
            <label className="form-label fw-semibold">
                Select Date
            </label>

            <input
                type="date"
                className="form-control glass-input"
                value={selectedDate}
                min={minDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e)=>setSelectedDate(e.target.value)}
            />
            </div>

            <div className="col-md-6 d-flex gap-2">
            <button
                className="btn glass flex-fill"
                onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
                }
            >
                Today
            </button>

            <button
                className="btn glass flex-fill"
                onClick={()=>{
                const d=new Date();
                d.setDate(d.getDate()-1);
                setSelectedDate(d.toISOString().split("T")[0]);
                }}
            >
                Yesterday
            </button>
            </div>

        </div>
        </div>

        {/* Top Stats */}
        <div className="row g-3 mb-4">

        <div className="col-md-4">
            <div className="glass p-4 h-100">
            <div className="icon-box mb-3"><i className="fas fa-bullseye" style={{ color: "white" }}></i></div>
            <small>Total Habits</small>
            <h2>{totalHabits}</h2>
            </div>
        </div>

        <div className="col-md-4">
            <div className="glass p-4 h-100">
            <div className="icon-box mb-3"><i className="fas fa-circle-check" style={{ color: "white" }}></i></div>
            <small>Selected Day</small>
            <h2>{completedToday}%</h2>
            </div>
        </div>

        <div className="col-md-4">
            <div className="glass p-4 h-100">
            <div className="icon-box mb-3"><i className="fas fa-fire" style={{ color: "white" }}></i></div>
            <small>Current Streak</small>
            <h2>{streak}</h2>
            </div>
        </div>

        </div>

        {/* Calendar */}
        <div className="glass p-4 mb-4">

        <div className="d-flex justify-content-between align-items-center mb-3">

            <button
            className="btn glass"
            disabled={
                year===new Date(minDate).getFullYear() &&
                month===new Date(minDate).getMonth()
            }
            onClick={()=>setCurrentMonth(new Date(year,month-1,1))}
            >
            <i className="fas fa-chevron-left"></i>
            </button>

            <h4 className="fw-bold mb-0">{monthName}</h4>

            <button
            className="btn glass"
            disabled={
                month===new Date().getMonth() &&
                year===new Date().getFullYear()
            }
            onClick={()=>setCurrentMonth(new Date(year,month+1,1))}
            >
            <i className="fas fa-chevron-right"></i>
            </button>

        </div>

        <div className="calendar-grid fw-semibold text-center mb-2">
            {["S","M","T","W","T","F","S"].map((d)=>(
            <div key={d}>{d}</div>
            ))}
        </div>


        <div className="d-flex justify-content-center gap-4 mb-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
                <div className="legend-dot legend-selected"></div>
                <small className="text-secondary">Selected</small>
            </div>

            <div className="d-flex align-items-center gap-2">
                <div className="legend-dot legend-completed"></div>
                <small className="text-secondary">Completed</small>
            </div>
        </div>

        <div className="calendar-grid">
            {Array.from({length:firstDay}).map((_,i)=>(
            <div key={i}></div>
            ))}

            {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1;

            const dateStr=
                `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

            const completed=completedDates.includes(dateStr);

            const disabled=
                dateStr<minDate ||
                dateStr>new Date().toISOString().split("T")[0];

            return(
                <button
                key={day}
                disabled={disabled}
                onClick={()=>setSelectedDate(dateStr)}
                className={`calendar-day ${
                    selectedDate===dateStr
                    ? "calendar-active"
                    : completed
                    ? "calendar-complete"
                    : ""
                }`}
                >
                {day}
                </button>
            );
            })}
        </div>

        </div>

        {/* Month Summary */}
        <div className="glass p-4 mb-4">

        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
            <h4 className="mb-0">{monthName}</h4>
            <small className="text-secondary">Monthly Summary</small>
            </div>

            <div className="text-end">
            <h2 className="fw-bold text-primary mb-0">
                {monthPercent}%
            </h2>
            <small>Completion</small>
            </div>
        </div>

        <div className="progress-glass mb-4">
            <div
            className="progress-fill"
            style={{width:`${monthPercent}%`}}
            ></div>
        </div>

        <div className="row text-center">

            <div className="col">
            <h3>{completedMonth}</h3>
            <small>Completed</small>
            </div>

            <div className="col">
            <h3>{missedMonth}</h3>
            <small>Missed</small>
            </div>

        </div>

        </div>

        {/* Weekly Chart */}
        <div className="glass p-4 mb-4">

        <div className="d-flex justify-content-between align-items-center mb-4">

            <button
            className="btn glass"
            onClick={()=>setWeekOffset(weekOffset-1)}
            >
            ←
            </button>

            <h4 className="mb-0">Weekly Progress(Habit)</h4>
            <small className="text-secondary">{weekRange}</small>
            
            <button
            className="btn glass"
            disabled={weekOffset===0}
            onClick={()=>setWeekOffset(weekOffset+1)}
            >
            →
            </button>

        </div>

        <div
            className="d-flex justify-content-between align-items-end"
            style={{height:"220px"}}
        >
            {weeklyData.map((item)=>(
            <div
                key={item.date}
                className="d-flex flex-column align-items-center"
            >

                <small className="fw-bold mb-2">
                {item.percent}%
                </small>

                <div
                style={{
                    width:"26px",
                    height:`${Math.max(item.percent*1.8,8)}px`,
                    borderRadius:"14px",
                    background:"linear-gradient(180deg,#5EE6FF,#4F7CFF)"
                }}
                ></div>

                <small className="mt-2">{item.day}</small>

            </div>
            ))}
        </div>

        </div>

        {/* History */}
        <div className="glass p-4">

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                <h4 className="mb-0">Daily History(Habit)</h4>
                <small className="text-secondary">{selectedDate}</small>
                </div>

                <div className="category-pill">
                {historyPercent}% Completed
                </div>
            </div>

            {history.length===0 ?(
                <div className="text-center py-4">
                <div style={{fontSize:"46px"}}><i className="fas fa-box-open"></i></div>
                <p className="text-secondary mb-0 mt-2">
                    No records for this day
                </p>
                </div>
            ):(
                history.map((item,index)=>(
                <div
                    key={index}
                    className="timeline-card mb-3"
                >

                    <div className="icon-box">
                        <i
                            className={`fas ${
                            item.completed ? "fa-circle-check" : "fa-circle"
                            }`}
                            style={{
                            color: item.completed ? "#22C55E" : "#CBD5E1",
                            }}
                        ></i>
                    </div>

                    <div className="flex-grow-1">
                    <h5 className="mb-0">{item.habits?.name}</h5>
                    <small className="text-secondary">
                        {item.habits?.category}
                    </small>
                    </div>

                </div>
                ))
            )}

            <hr className="my-4" />

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h4 className="mb-0">Today's Schedule</h4>
                        <small className="text-secondary">
                        {completedSchedules} of {totalSchedules} completed
                        </small>
                    </div>

                        <div className="category-pill">
                            {schedulePercent}% Completed
                        </div>
                    </div>

                    {scheduleHistory.length === 0 ? (
                    <div className="text-center py-4">
                        <div style={{ fontSize: "42px", color: "#5B5DFF" }}>
                            <i className="fas fa-calendar-xmark"></i>
                        </div>
                        <p className="text-secondary mt-2 mb-0">
                        No schedule records for this day
                        </p>
                    </div>
                    ) : (
                    scheduleHistory.map((item, index) => (
                        <div
                        key={index}
                        className="timeline-card mb-3 d-flex justify-content-between align-items-center"
                        >
                            <div>
                                <h6 className="mb-1">
                                {item.schedules?.activity}
                                </h6>

                                <small className="text-secondary">
                                {item.schedules?.start_time?.slice(0, 5)} –{" "}
                                {item.schedules?.end_time?.slice(0, 5)}
                                </small>
                            </div>

                            <div style={{ fontSize: "24px" }}>
                                <i
                                    className={`fas ${
                                    item.completed ? "fa-circle-check" : "fa-circle"
                                    }`}
                                    style={{
                                    color: item.completed ? "#22C55E" : "#CBD5E1",
                                    }}
                                ></i>
                            </div>
                        </div>
                    ))  
                )}

            </div>

        </div>
    );
}