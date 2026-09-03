import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DailyTracker({ goBack, refreshDashboard }) {
  const [habits, setHabits] = useState([]);
  const [schedule, setSchedule] = useState([]);

  const [activeView, setActiveView] = useState("habits");
  const [scheduleLogs, setScheduleLogs] = useState({});

  const [currentTime, setCurrentTime] = useState("");
  const [currentActivityId, setCurrentActivityId] = useState(null);

  useEffect(() => {
    fetchHabits();
    fetchSchedule();
  }, []);

  useEffect(() => {
  const updateClock = () => {
    const now = new Date();

    const time =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    setCurrentTime(time);
  };

  updateClock();

  const interval = setInterval(updateClock, 60000);

  return () => clearInterval(interval);
}, []);

  // ---------- HABITS ----------
  const fetchHabits = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id);

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

  // ---------- TODAY'S SCHEDULE ----------
  const fetchSchedule = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const weekday = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const today = new Date().toISOString().split("T")[0];

    const { data: schedules } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_of_week", weekday)
      .order("start_time");

    const { data: logs } = await supabase
      .from("schedule_logs")
      .select("schedule_id, completed")
      .eq("user_id", user.id)
      .eq("log_date", today);

    const map = {};

    logs?.forEach((log) => {
      map[log.schedule_id] = log.completed;
    });

    setSchedule(schedules || []);
    setScheduleLogs(map);
  };

  const timeline = [...schedule]
  .sort((a, b) => a.start_time.localeCompare(b.start_time))
  .map((task) => ({
    ...task,
    completed: scheduleLogs[task.id] || false,
  }));

  useEffect(() => {
    const activeTask = timeline.find((task) => {
      return (
        currentTime >= task.start_time &&
        currentTime < task.end_time
      );
    });

    setCurrentActivityId(activeTask?.id || null);
  }, [timeline, currentTime]);

    // ---------- SAVE BOTH ----------
    const saveProgress = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const today = new Date().toISOString().split("T")[0];

        // HABITS
        const habitRows = habits.map((h) => ({
            user_id: user.id,
            habit_id: h.id,
            log_date: today,
            completed: h.completed,
        }));

        const { error: habitError } = await supabase
            .from("habit_logs")
            .upsert(habitRows, {
            onConflict: "user_id,habit_id,log_date",
            });

        if (habitError) {
            console.log(habitError);
            alert(habitError.message);
            return;
        }

        // SCHEDULES
        const scheduleRows = timeline.map((s) => ({
            user_id: user.id,
            schedule_id: s.id,
            log_date: today,
            completed: s.completed,
        }));

        const { error: scheduleError } = await supabase
            .from("schedule_logs")
            .upsert(scheduleRows, {
            onConflict: "user_id,schedule_id,log_date",
            });

        if (scheduleError) {
            console.log(scheduleError);
            alert(scheduleError.message);
            return;
        }

        if (refreshDashboard) refreshDashboard();

        alert("Today's progress saved!");
    }; 




  const toggleSchedule = (id) => {
    setScheduleLogs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="container py-5 page-enter">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="fas fa-list-check me-2 text-primary"></i>
            Daily Tracker
          </h2>
          <p className="text-secondary mb-0">
            Track today's habits and schedule
          </p>
        </div>

        <button className="btn glass-btn px-4" onClick={goBack}>
          <i className="fas fa-arrow-left me-2"></i>
          Dashboard
        </button>
      </div>

      {/* TOGGLE BUTTONS */}
      <div className="glass p-2 mb-4">
        <div className="d-flex">
          <button
            className={`btn flex-fill ${
              activeView === "habits" ? "btn-primary" : "btn-light"
            }`}
            onClick={() => setActiveView("habits")} >
              <i class="fa-solid fa-person-walking me-2"></i> Today's Habits
          </button>

          <button
            className={`btn flex-fill ms-2 ${
              activeView === "schedule" ? "btn-primary" : "btn-light"
            }`}
            onClick={() => setActiveView("schedule")}
          >
           <i className="fas fa-calendar-day me-2"></i> Today's Schedule
          </button>
        </div>
      </div>

      {/* HABITS */}
      {activeView === "habits" && (
        <div className="glass p-4 mb-4">
          <h4 className="mb-3"><i class="fa-solid fa-person-walking me-2"></i> Today's Habits</h4>

          {habits.length === 0 ? (
            <p className="text-secondary"><i className="far fa-face-smile me-2"></i> No habits created yet.</p>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="timeline-card mb-3 d-flex justify-content-between align-items-center"
              >
                <div>
                  <h5 className="mb-1">{habit.name}</h5>
                  <small className="text-secondary">{habit.category}</small>
                </div>

                <input
                  type="checkbox"
                  style={{ width: 22, height: 22 }}
                  checked={habit.completed}
                  onChange={() =>
                    setHabits((prev) =>
                      prev.map((h) =>
                        h.id === habit.id
                          ? { ...h, completed: !h.completed }
                          : h
                      )
                    )
                  }
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* SCHEDULE */}
      {activeView === "schedule" && (
        <div className="glass p-4 mb-4">
          <h4 className="mb-3"><i className="fas fa-clock text-warning me-2"></i>Today's Schedule</h4>

          {timeline.length === 0 ? (
            <p className="text-secondary"><i className="far fa-calendar-xmark me-2"></i>Nothing scheduled for today.</p>
          ) : (
            timeline.map((task) => (
              <div
                key={task.id}
                className={`timeline-card mb-3 d-flex justify-content-between align-items-center ${
                  currentActivityId === task.id ? "current-task" : ""
                }`}
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-1">{task.activity}</h5>

                    {currentActivityId === task.id && (
                      <span className="live-badge">LIVE NOW</span>
                    )}
                  </div>

                  <small className="text-secondary">
                    {task.start_time?.slice(0, 5)} -{" "}
                    {task.end_time?.slice(0, 5)}
                  </small>
                </div>

                <input
                  type="checkbox"
                  style={{ width: 22, height: 22 }}
                  checked={task.completed}
                  onChange={() => toggleSchedule(task.id)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* SAVE */}
      <div className="glass p-4">
        <button
          className="btn w-100 text-white fw-semibold py-3 rounded-4"
          onClick={saveProgress}
          style={{
            background: "linear-gradient(135deg,#4F7CFF,#5B5DFF)",
            border: "none",
          }}
        >
          <i className="fas fa-floppy-disk me-2"></i> Save Today's Progress
        </button>
      </div>
    </div>
  );
}