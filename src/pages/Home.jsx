import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ScheduleSetup from "../components/ScheduleSetup";
import HabitSetup from "../components/HabitSetup";
import DailyTracker from "../components/DailyTracker";
import Reports from "../components/Reports";

function Home({ user, logout, showToast }) {
  const [screen, setScreen] = useState("dashboard");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { count: habitsCount } = await supabase
      .from("habits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: completedCount } = await supabase
      .from("habit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("log_date", today)
      .eq("completed", true);

    setTotal(habitsCount || 0);
    setCompleted(completedCount || 0);

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("log_date")
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("log_date", { ascending: false });

    const unique = [...new Set(logs?.map((l) => l.log_date) || [])];

    let current = 0;
    const d = new Date();

    while (true) {
      const day = d.toISOString().split("T")[0];

      if (unique.includes(day)) {
        current++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(current);
  };

  if (screen === "schedule") {
    return (
      <ScheduleSetup
        goBack={() => setScreen("dashboard")}
        showToast={showToast}
      />
    );
  }

  if (screen === "habits") {
    return (
      <HabitSetup
        goBack={() => setScreen("dashboard")}
        showToast={showToast}
      />
    );
  }

  if (screen === "tracker") {
    return (
      <DailyTracker
        goBack={() => {
          loadDashboard();
          setScreen("dashboard");
        }}
        refreshDashboard={loadDashboard}
        showToast={showToast}
      />
    );
  }

  if (screen === "reports") {
    return <Reports goBack={() => setScreen("dashboard")} />;
  }

  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="container py-4 page-enter">

      {/* Header */}
      <div className="dashboard-header mb-4">
        <div>
          <p className="greeting mb-1">Welcome back 👋</p>

          <h1 className="fw-bold">
            {user.user_metadata?.full_name || user.email}
          </h1>

          <small className="text-secondary">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </small>
        </div>

        <button className="btn glass-btn logout-btn" onClick={logout}>
          <i className="fas fa-right-from-bracket"></i>
        </button>
      </div>

      {/* Hero */}
      <div className="hero-card mb-4">
        <div className="hero-content">

          <div>
            <span className="hero-label">Today's Progress</span>

            <h1 className="hero-number">
              {completed}/{total}
            </h1>

            <p className="hero-sub">
              {percentage}% completed today
            </p>
          </div>

          <div className="streak-card">
            <i className="fas fa-fire"></i>

            <div>
              <h3>{streak}</h3>
              <small>Day Streak</small>
            </div>
          </div>

        </div>

        <div className="progress-glass mt-4">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass p-3 mb-4">

        <div className="section-head mb-3">
          <div>
            <h5 className="mb-0">Quick Actions</h5>
            <small className="text-secondary">
              Jump directly to any feature
            </small>
          </div>
        </div>

        <div className="quick-grid">

          <div
            className="quick-card"
            onClick={() => setScreen("tracker")}
          >
            <div className="quick-icon blue">
              <i className="fas fa-list-check"></i>
            </div>

            <div>
              <h6>Daily Tracker</h6>
              <p>Complete today's habits</p>
            </div>
          </div>

          <div
            className="quick-card"
            onClick={() => setScreen("habits")}
          >
            <div className="quick-icon green">
              <i className="fas fa-seedling"></i>
            </div>

            <div>
              <h6>Habit Setup</h6>
              <p>Create & manage habits</p>
            </div>
          </div>

          <div
            className="quick-card"
            onClick={() => setScreen("schedule")}
          >
            <div className="quick-icon purple">
              <i className="fas fa-calendar-days"></i>
            </div>

            <div>
              <h6>Schedule</h6>
              <p>Plan weekly routine</p>
            </div>
          </div>

          <div
            className="quick-card"
            onClick={() => setScreen("reports")}
          >
            <div className="quick-icon orange">
              <i className="fas fa-chart-line"></i>
            </div>

            <div>
              <h6>Reports</h6>
              <p>Analytics & insights</p>
            </div>
          </div>

        </div>

      </div>

      {/* Overview */}
      <div className="section-head mb-3">
        <div>
          <h5 className="mb-0">Today's Overview</h5>
          <small className="text-secondary">
            Your productivity snapshot
          </small>
        </div>
      </div>

      <div className="stats-grid">

        <div className="glass stat-card">
          <div className="icon-box">
            <i className="fas fa-bullseye"></i>
          </div>

          <div>
            <small>Total Habits</small>
            <h2>{total}</h2>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="icon-box">
            <i className="fas fa-circle-check"></i>
          </div>

          <div>
            <small>Completed</small>
            <h2>{completed}</h2>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="icon-box">
            <i className="fas fa-fire"></i>
          </div>

          <div>
            <small>Current Streak</small>
            <h2>{streak}</h2>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Home;