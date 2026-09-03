import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DailyTracker({ goBack, refreshDashboard }) {
    const [habits, setHabits] = useState([]);
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        Promise.all([fetchHabits(), fetchSchedule()]);
    }, []);
  
    const fetchHabits = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const today = new Date().toISOString().split("T")[0];

        // Get all habits
        const { data: habitsData } = await supabase
            .from("habits")
            .select("*")
            .eq("user_id", user.id);

        // Get today's saved progress
        const { data: logs } = await supabase
            .from("habit_logs")
            .select("habit_id, completed")
            .eq("user_id", user.id)
            .eq("log_date", today);

        const completedMap = {};

        logs?.forEach((log) => {
            completedMap[log.habit_id] = log.completed;
        });

        const formatted = (habitsData || []).map((habit) => ({
            ...habit,
            completed: completedMap[habit.id] || false,
        }));

        setHabits(formatted);
    };

    const fetchSchedule = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const today = new Date().toLocaleDateString("en-US", {
            weekday: "long",
        });

        const { data, error } = await supabase
            .from("schedules")
            .select("*")
            .eq("user_id", user.id)
            .eq("day_of_week", today)
            .order("start_time");

        if (!error) {
            setSchedule(data || []);
        }
    };


    // const toggleHabit = (id) => {
    //     setHabits((prev) =>
    //         prev.map((h) =>
    //             h.id === id
    //                 ? { ...h, completed: !h.completed }
    //                 : h
    //         )
    //     );
    // };

    const [completedTasks, setCompletedTasks] = useState({});

        const timeline = schedule.map((task) => ({
        ...task,
        completed: completedTasks[task.id] || false,
        category: "Schedule",
    }));


    const saveProgress = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const today = new Date().toISOString().split("T")[0];

        const rows = habits.map((h) => ({
            user_id: user.id,
            habit_id: h.id,
            log_date: today,
            completed: h.completed,
        }));

        const { error } = await supabase
            .from("habit_logs")
            .upsert(rows, {
            onConflict: "user_id,habit_id,log_date",
            });

        if (error) {
            alert(error.message);
            return;
        }

        if (refreshDashboard) refreshDashboard();

        alert("Today's progress saved!");
    };

    const toggleComplete = (task) => {
        setCompletedTasks((prev) => ({
            ...prev,
            [task.id]: !prev[task.id],
        }));
    };

    return (
        <div className="container py-5 page-enter">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="fas fa-chart-line me-2 text-primary"></i>
                        Daily Tracker
                    </h2>
                    <p className="text-secondary mb-0">
                    Follow your routine and complete today's habits
                    </p>
                </div>

                <button className="btn glass-btn px-4" onClick={goBack}>
                    <i className="fas fa-arrow-left me-2"></i>Dashboard
                </button>
                </div>

                {/* Timeline */}
                <div className="glass p-4 mb-4">
                <div className="d-flex align-items-center mb-3">
                    <div className="icon-box me-3">⏰</div>
                    <div>
                    <h4 className="mb-0">Today's Timeline</h4>
                    <small className="text-secondary">
                        {timeline.length} scheduled activities
                    </small>
                    </div>
                </div>

                {timeline.length === 0 ? (
                    <div className="text-center py-5">
                    <div style={{ fontSize: "48px" }}>📅</div>
                    <h5 className="mt-3">Nothing Scheduled</h5>
                    <p className="text-secondary mb-0">
                        Add activities in Schedule Setup.
                    </p>
                    </div>
                ) : (
                    timeline.map((item) => (
                    <div key={item.id} className="timeline-card mb-3">

                        <div className="timeline-time">
                        {item.start_time?.slice(0,5)}
                        </div>

                        <div className="flex-grow-1">
                        <h5 className="mb-1">{item.activity}</h5>

                        <small className="text-secondary">
                            {item.start_time?.slice(0,5)} — {item.end_time?.slice(0,5)}
                        </small>

                        <div className="mt-2">
                            <span className="category-pill">
                            {item.category}
                            </span>
                        </div>
                        </div>

                        <input
                            type="checkbox"
                            className="tracker-check"
                            checked={item.completed}
                            onChange={() => toggleComplete(item)}
                        />

                    </div>
                    ))
                )}
                </div>

                {/* Save Button */}
                <div className="glass p-4">
                <button
                    className="btn w-100 text-white fw-semibold py-3 rounded-4"
                    onClick={saveProgress}
                    style={{
                    background: "linear-gradient(135deg,#4F7CFF,#5B5DFF)",
                    border: "none",
                    boxShadow: "0 12px 28px rgba(79,124,255,.35)"
                    }}
                >
                    💾 Save Today's Progress
                </button>
            </div>

        </div>
    );
}