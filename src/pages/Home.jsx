import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ScheduleSetup from "../components/ScheduleSetup";
import HabitSetup from "../components/HabitSetup";
import DailyTracker from "../components/DailyTracker";
import Reports from "../components/Reports";

function Home({ user, logout }) {
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
    return <ScheduleSetup goBack={() => setScreen("dashboard")} />;
  }

  if (screen === "habits") {
    return <HabitSetup goBack={() => setScreen("dashboard")} />;
  }

  if (screen === "tracker") {
    return (
      <DailyTracker
        goBack={() => {
          loadDashboard();
          setScreen("dashboard");
        }}
      />
    );
  }

  if (screen === "reports") {
    return <Reports goBack={() => setScreen("dashboard")} />;
  }

  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
      <div className="container py-5 page-enter">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 className="fw-bold">Welcome&nbsp;
                    <span className="text-primary fw-bold">{user.user_metadata?.full_name || user.email}</span>
                </h1> 

                <p className="text-secondary mb-0">
                {new Date().toLocaleDateString("en-US",{
                    weekday:"long",
                    day:"numeric",
                    month:"long",
                    year:"numeric"
                })}
                </p>
            </div>

            <button className="btn glass-btn px-4" onClick={logout}>
                <i class="fa-solid fa-right-from-bracket" style={{ fontSize: "32px" }}></i>
            </button>
            </div>

            {/* Hero */}
            <div className="hero-card px-4 py-3 mb-4">

            <div className="d-flex justify-content-between">
                <div>
                <small>Today's Progress</small>
                <h1 className="display-3 fw-bold">
                    {completed}/{total}
                </h1>
                </div>

                <div className="glass p-3 text-center">
                <h2><i className="fas fa-fire me-2"></i>{streak}</h2> 
                <small>Day Streak</small>
                </div>
            </div>

            <div className="progress-glass mt-4">
                <div
                className="progress-fill"
                style={{
                    width:`${total===0?0:(completed/total)*100}%`
                }}
                />
            </div>

            <div className="d-flex justify-content-between mt-3">
                <h5>{total===0?0:Math.round((completed/total)*100)}%</h5>
                <small>Consistency is the key 💙</small>
            </div>

            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">

            <div className="col-6 col-md-4">
                <div className="glass p-3 h-100">
                <div className="icon-box mb-3"><i className="fas fa-bullseye"></i></div>
                <small>Total Habits</small>
                <h2>{total}</h2>
                </div>
            </div>

            <div className="col-6 col-md-4">
                <div className="glass p-3 h-100">
                <div className="icon-box mb-3">  <i className="fas fa-circle-check"></i></div>
                <small>Completed</small>
                <h2>{completed}</h2>
                </div>
            </div>

            <div className="col-12 col-md-4">
                <div className="glass p-3 h-100">
                <div className="icon-box mb-3"><i className="fas fa-fire"></i></div>
                <small>Current Streak</small>
                <h2>{streak}</h2>
                </div>
            </div>

            </div>

            {/* Navigation */}
            <div className="row g-4 text-center text-md-start">
              <div className="col-6 col-md-3">
                <div className="feature-card tracker-card" onClick={() => setScreen("tracker")}>
                  <div className="feature-icon">
                    <i className="fas fa-list-check"></i>
                  </div>

                  <h4>Daily Tracker</h4>
                  <p>Complete today's habits</p>

                  <span className="feature-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="feature-card habit-card" onClick={() => setScreen("habits")}>
                  <div className="feature-icon">
                    <i className="fas fa-seedling"></i>
                  </div>

                  <h4>Habit Setup</h4>
                  <p>Create & manage habits</p>

                  <span className="feature-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="feature-card schedule-card" onClick={() => setScreen("schedule")}>
                  <div className="feature-icon">
                    <i className="fas fa-calendar-days"></i>
                  </div>

                  <h4>Schedule</h4>
                  <p>Plan your weekly routine</p>

                  <span className="feature-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="feature-card report-card" onClick={() => setScreen("reports")}>
                  <div className="feature-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>

                  <h4>Reports</h4>
                  <p>View analytics & progress</p>

                  <span className="feature-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </div>

            </div>

        </div>
    );
}

export default Home;