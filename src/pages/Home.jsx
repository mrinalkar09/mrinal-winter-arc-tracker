import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import ScheduleSetup from "../components/ScheduleSetup";
import HabitSetup from "../components/HabitSetup";
import DailyTracker from "../components/DailyTracker";
import Reports from "../components/Reports";
import HabitAnalytics from "../components/HabitAnalytics";

function Home({ user, logout, showToast }) {

  const [screen, setScreen] = useState("dashboard");

  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {

    const today =
      new Date().toISOString().split("T")[0];

    // -------------------------
    // TOTAL HABITS
    // -------------------------

    const { count: habitsCount } =
      await supabase
        .from("habits")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("is_active", true);

    // -------------------------
    // COMPLETED TODAY
    // -------------------------

    const { count: completedCount } =
      await supabase
        .from("habit_logs")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("log_date", today)
        .eq("completed", true);

    setTotal(habitsCount || 0);
    setCompleted(completedCount || 0);

    // -------------------------
    // STREAK
    // -------------------------

    const { data: logs } =
      await supabase
        .from("habit_logs")
        .select("log_date")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("log_date", {
          ascending: false,
        });

    const unique = [
      ...new Set(
        logs?.map((l) => l.log_date) || []
      ),
    ];

    let current = 0;

    const d = new Date();

    while (true) {

      const day =
        d.toISOString().split("T")[0];

      if (unique.includes(day)) {

        current++;

        d.setDate(
          d.getDate() - 1
        );

      } else {

        break;

      }
    }

    setStreak(current);
  };


  // ==================================================
  // SCREEN NAVIGATION
  // ==================================================

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

    return (
      <Reports
        goBack={() => setScreen("dashboard")}
      />
    );

  }


  if (screen === "analytics") {

    return (
      <HabitAnalytics
        goBack={() => setScreen("dashboard")}
      />
    );

  }


  const percentage =
    total === 0
      ? 0
      : Math.round(
          (completed / total) * 100
        );


  return (

    <div className="container py-5 page-enter">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="dashboard-header">

        <div>

          <div className="dashboard-eyebrow">
            YOUR DAILY JOURNEY
          </div>

          <h1 className="dashboard-title">

            Welcome{" "}

            <span>
              {user.user_metadata?.full_name ||
                user.email}
            </span>

          </h1>

          <p className="text-secondary mb-0">

            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}

          </p>

        </div>


        <button
          className="dashboard-logout"
          onClick={logout}
        >

          <i className="fas fa-right-from-bracket"></i>

          <span>Logout</span>

        </button>

      </div>


      {/* =========================================
          TODAY'S PROGRESS
      ========================================= */}

      <div className="dashboard-progress">

        <div className="progress-content">

          <small>
            TODAY'S PROGRESS
          </small>

          <h1>
            {completed} / {total}
          </h1>

          <div className="dashboard-progress-track">

            <div
              className="dashboard-progress-fill"
              style={{
                width: `${percentage}%`,
              }}
            />

          </div>

          <div className="dashboard-progress-footer">

            <strong>
              {percentage}%
            </strong>

            <span>
              Consistency is the key 💙
            </span>

          </div>

        </div>


        {/* STREAK */}

        <div className="dashboard-streak">

          <div className="streak-icon">

            <i className="fas fa-fire"></i>

          </div>

          <strong>
            {streak}
          </strong>

          <span>
            Day Streak
          </span>

        </div>

      </div>


      {/* =========================================
          STATISTICS
      ========================================= */}

      <div className="row g-3 mb-5">

        <div className="col-6 col-md-4">

          <div className="dashboard-stat">

            <div className="dashboard-stat-icon">
              <i className="fas fa-bullseye"></i>
            </div>

            <div>

              <small>
                Total Habits
              </small>

              <h2>
                {total}
              </h2>

            </div>

          </div>

        </div>


        <div className="col-6 col-md-4">

          <div className="dashboard-stat">

            <div className="dashboard-stat-icon">
              <i className="fas fa-circle-check"></i>
            </div>

            <div>

              <small>
                Completed
              </small>

              <h2>
                {completed}
              </h2>

            </div>

          </div>

        </div>


        <div className="col-12 col-md-4">

          <div className="dashboard-stat">

            <div className="dashboard-stat-icon">
              <i className="fas fa-fire"></i>
            </div>

            <div>

              <small>
                Current Streak
              </small>

              <h2>
                {streak}
              </h2>

            </div>

          </div>

        </div>

      </div>


      {/* =========================================
          WORKSPACE
      ========================================= */}

      <section className="dashboard-section">

        <div className="dashboard-section-label">
          WORKSPACE
        </div>

        <div className="dashboard-section-header">

          <div>

            <h2>
              Quick Actions
            </h2>

            <p>
              Manage your daily routine and habits
            </p>

          </div>

        </div>


        <div className="workspace-grid">

          {/* DAILY TRACKER */}

          <div
            className="workspace-card tracker-workspace"
            onClick={() =>
              setScreen("tracker")
            }
          >

            <div className="workspace-icon">

              <i className="fas fa-list-check"></i>

            </div>

            <div className="workspace-content">

              <h3>
                Daily Tracker
              </h3>

              <p>
                Complete today's habits
                <br />
                and stay on track.
              </p>

            </div>

            <div className="workspace-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="workspace-decoration">
              <i className="fas fa-clipboard-check"></i>
            </div>

          </div>


          {/* HABIT SETUP */}

          <div
            className="workspace-card habit-workspace"
            onClick={() =>
              setScreen("habits")
            }
          >

            <div className="workspace-icon">

              <i className="fas fa-seedling"></i>

            </div>

            <div className="workspace-content">

              <h3>
                Habit Setup
              </h3>

              <p>
                Create and manage
                <br />
                your habits.
              </p>

            </div>

            <div className="workspace-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="workspace-decoration">
              <i className="fas fa-leaf"></i>
            </div>

          </div>


          {/* SCHEDULE */}

          <div
            className="workspace-card schedule-workspace"
            onClick={() =>
              setScreen("schedule")
            }
          >

            <div className="workspace-icon">

              <i className="fas fa-calendar-days"></i>

            </div>

            <div className="workspace-content">

              <h3>
                Schedule
              </h3>

              <p>
                Plan your weekly
                <br />
                routine.
              </p>

            </div>

            <div className="workspace-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="workspace-decoration">
              <i className="fas fa-calendar"></i>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          INSIGHTS
      ========================================= */}

      <section className="dashboard-section insights-section">

        <div className="dashboard-section-label">
          PROGRESS
        </div>

        <div className="dashboard-section-header">

          <div>

            <h2>
              Insights
            </h2>

            <p>
              Understand your consistency and growth
            </p>

          </div>

        </div>


        <div className="insights-grid">

          {/* REPORTS */}

          <div
            className="insight-card reports-insight"
            onClick={() =>
              setScreen("reports")
            }
          >

            <div className="insight-icon">

              <i className="fas fa-chart-line"></i>

            </div>

            <div className="insight-content">

              <h3>
                Reports
              </h3>

              <p>
                View your overall progress
                <br />
                and consistency.
              </p>

            </div>

            <div className="insight-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="insight-decoration">
              <i className="fas fa-chart-column"></i>
            </div>

          </div>


          {/* HABIT ANALYTICS */}

          <div
            className="insight-card analytics-insight"
            onClick={() =>
              setScreen("analytics")
            }
          >

            <div className="insight-icon">

              <i className="fas fa-chart-simple"></i>

            </div>

            <div className="insight-content">

              <h3>
                Habit Analytics
              </h3>

              <p>
                Track individual habit
                <br />
                performance.
              </p>

            </div>

            <div className="insight-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="insight-decoration">
              <i className="fas fa-chart-bar"></i>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;