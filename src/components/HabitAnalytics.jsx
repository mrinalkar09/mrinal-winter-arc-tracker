import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function HabitAnalytics({ goBack }) {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);

  const [selectedHabitId, setSelectedHabitId] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (habitsError) {
      console.error(habitsError);
    }

    const { data: logsData, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id, log_date, completed")
      .eq("user_id", user.id);

    if (logsError) {
      console.error(logsError);
    }

    setHabits(habitsData || []);
    setLogs(logsData || []);

    setLoading(false);
  };

  // =========================
  // MONTH DATA
  // =========================

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const getDateString = (day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  // =========================
  // FILTER LOGS
  // =========================

  const filteredLogs = useMemo(() => {
    if (selectedHabitId === "all") {
      return logs;
    }

    return logs.filter(
      (log) => String(log.habit_id) === String(selectedHabitId)
    );
  }, [logs, selectedHabitId]);

  // =========================
  // MONTH COMPLETION
  // =========================

  const monthStats = useMemo(() => {
    const monthLogs = filteredLogs.filter((log) => {
      const date = new Date(`${log.log_date}T00:00:00`);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });

    const completed = monthLogs.filter(
      (log) => log.completed
    ).length;

    const total = monthLogs.length;

    const percentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return {
      completed,
      total,
      percentage,
    };
  }, [filteredLogs, year, month]);

  // =========================
  // DAILY GRID
  // =========================

  const getDayStatus = (day) => {
    const date = getDateString(day);

    if (selectedHabitId === "all") {
      const dayLogs = logs.filter(
        (log) => log.log_date === date
      );

      if (dayLogs.length === 0) return "empty";

      const completed = dayLogs.filter(
        (log) => log.completed
      ).length;

      return completed > 0 ? "completed" : "missed";
    }

    const log = logs.find(
      (item) =>
        String(item.habit_id) === String(selectedHabitId) &&
        item.log_date === date
    );

    if (!log) return "empty";

    return log.completed ? "completed" : "missed";
  };

  // =========================
  // LAST 30 DAYS
  // =========================

  const chartData = useMemo(() => {
    const result = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const dateString = date.toISOString().split("T")[0];

      let percent = 0;

      if (selectedHabitId === "all") {
        const dayLogs = logs.filter(
          (log) => log.log_date === dateString
        );

        if (dayLogs.length > 0) {
          const completed = dayLogs.filter(
            (log) => log.completed
          ).length;

          percent = Math.round(
            (completed / dayLogs.length) * 100
          );
        }
      } else {
        const log = logs.find(
          (item) =>
            String(item.habit_id) ===
              String(selectedHabitId) &&
            item.log_date === dateString
        );

        percent = log?.completed ? 100 : 0;
      }

      result.push({
        date: dateString,
        percent,
        label: date.getDate(),
      });
    }

    return result;
  }, [logs, selectedHabitId]);

  // =========================
  // STREAK
  // =========================

  const currentStreak = useMemo(() => {
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const dateString = date.toISOString().split("T")[0];

      let completed = false;

      if (selectedHabitId === "all") {
        const dayLogs = logs.filter(
          (log) => log.log_date === dateString
        );

        completed =
          dayLogs.length > 0 &&
          dayLogs.some((log) => log.completed);
      } else {
        completed = logs.some(
          (log) =>
            String(log.habit_id) ===
              String(selectedHabitId) &&
            log.log_date === dateString &&
            log.completed
        );
      }

      if (!completed) break;

      streak++;
    }

    return streak;
  }, [logs, selectedHabitId]);

  // =========================
  // MONTH NAVIGATION
  // =========================

  const previousMonth = () => {
    setCurrentMonth(
      new Date(year, month - 1, 1)
    );
  };

  const nextMonth = () => {
    const next = new Date(year, month + 1, 1);
    const now = new Date();

    if (
      next.getFullYear() > now.getFullYear() ||
      (
        next.getFullYear() === now.getFullYear() &&
        next.getMonth() > now.getMonth()
      )
    ) {
      return;
    }

    setCurrentMonth(next);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="glass p-5 text-center">
          <h5>Loading habit analytics...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 page-enter">

      {/* HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Habit Analytics
          </h2>

          <p className="text-secondary mb-0">
            Understand your consistency and progress
          </p>
        </div>

        <button
          className="btn glass-btn px-4"
          onClick={goBack}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Dashboard
        </button>
      </div>

      {/* HABIT SELECTOR */}

      <div className="glass p-4 mb-4">

        <label className="form-label fw-semibold">
          Select Habit
        </label>

        <select
          className="form-select glass-input"
          value={selectedHabitId}
          onChange={(e) =>
            setSelectedHabitId(e.target.value)
          }
        >
          <option value="all">
            All Habits
          </option>

          {habits.map((habit) => (
            <option
              key={habit.id}
              value={habit.id}
            >
              {habit.name}
            </option>
          ))}
        </select>

      </div>

      {/* STATS */}

      <div className="row g-3 mb-4">

        <div className="col-6 col-md-4">
          <div className="glass p-4 h-100">
            <div className="icon-box mb-3">
              <i className="fas fa-bullseye"></i>
            </div>

            <small>Completion</small>

            <h2 className="fw-bold">
              {monthStats.percentage}%
            </h2>
          </div>
        </div>

        <div className="col-6 col-md-4">
          <div className="glass p-4 h-100">
            <div className="icon-box mb-3">
              <i className="fas fa-check"></i>
            </div>

            <small>Completed</small>

            <h2 className="fw-bold">
              {monthStats.completed}
            </h2>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="glass p-4 h-100">
            <div className="icon-box mb-3">
              <i className="fas fa-fire"></i>
            </div>

            <small>Current Streak</small>

            <h2 className="fw-bold">
              {currentStreak}
            </h2>
          </div>
        </div>

      </div>

      {/* MONTHLY TRACKING */}

      <div className="glass p-4 mb-4">

        <div className="d-flex justify-content-between align-items-center mb-4">

          <button
            className="btn glass"
            onClick={previousMonth}
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <h4 className="mb-0">
            {monthName}
          </h4>

          <button
            className="btn glass"
            onClick={nextMonth}
          >
            <i className="fas fa-chevron-right"></i>
          </button>

        </div>

        <div className="habit-month-grid">

          {Array.from(
            { length: daysInMonth },
            (_, index) => {

              const day = index + 1;
              const status = getDayStatus(day);

              return (
                <div
                  key={day}
                  className={`habit-day ${status}`}
                >
                  <small>
                    {day}
                  </small>
                </div>
              );
            }
          )}

        </div>

        <div className="d-flex gap-3 justify-content-center mt-4 flex-wrap">

          <div className="d-flex align-items-center gap-2">
            <span className="analytics-dot completed"></span>
            <small>Completed</small>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="analytics-dot missed"></span>
            <small>Missed</small>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="analytics-dot empty"></span>
            <small>No record</small>
          </div>

        </div>

      </div>

      {/* 30 DAY CHART */}

      <div className="glass p-4 mb-4">

        <div className="mb-4">
          <h4 className="mb-1">
            30-Day Progress
          </h4>

          <small className="text-secondary">
            Your completion trend over the last 30 days
          </small>
        </div>

        <div className="habit-chart">

          {chartData.map((item) => (
            <div
              key={item.date}
              className="habit-chart-column"
            >

              <small className="chart-percent">
                {item.percent}%
              </small>

              <div className="chart-bar-container">

                <div
                  className="habit-chart-bar"
                  style={{
                    height: `${Math.max(
                      item.percent * 1.6,
                      5
                    )}px`,
                  }}
                />

              </div>

              <small className="chart-label">
                {item.label}
              </small>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}