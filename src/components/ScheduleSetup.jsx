import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ScheduleSetup({ goBack }) {
  const [activeDay, setActiveDay] = useState("Monday");
  const [schedule, setSchedule] = useState([]);
  const sortedSchedule = [...schedule].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );


  const [activity, setActivity] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    fetchSchedule();
  }, [activeDay]);

  // Load schedule from Supabase
  const fetchSchedule = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_of_week", activeDay)
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setSchedule(data || []);
  };

  // Add activity
  const addTask = async () => {
    if (!activity || !start || !end) {
      alert("Please fill all fields.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // EDIT MODE
    if (editingId) {
      const { error } = await supabase
        .from("schedules")
        .update({
          activity,
          start_time: start,
          end_time: end,
        })
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }

      setEditingId(null);
    }

    // CREATE MODE
    else {
      const { error } = await supabase.from("schedules").insert([
        {
          user_id: user.id,
          day_of_week: activeDay,
          activity,
          start_time: start,
          end_time: end,
        },
      ]);

      if (error) {
        alert(error.message);
        return;
      }
    }

    // Reset form
    setActivity("");
    setStart("");
    setEnd("");
    setEditingId(null);

    fetchSchedule();
  }; 



  const editTask = (task) => {
    setEditingId(task.id);
    setActivity(task.activity);
    setStart(task.start_time);
    setEnd(task.end_time);
  };


  // Delete activity
  const deleteTask = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this activity?"
    );

    if (!confirmDelete) return;

    await supabase
      .from("schedules")
      .delete()
      .eq("id", id);

    if (editingId === id) {
      setEditingId(null);
      setActivity("");
      setStart("");
      setEnd("");
    }

    fetchSchedule();
  };


  const copySchedule = async () => {
    if (selectedDays.length === 0) {
      alert("Select at least one day.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get current day's schedule
    const { data: current } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_of_week", activeDay);

    if (!current?.length) {
      alert("No activities to copy.");
      return;
    }

    // Delete old schedules of selected days
    await supabase
      .from("schedules")
      .delete()
      .eq("user_id", user.id)
      .in("day_of_week", selectedDays);

    // Create new rows
    const rows = [];

    selectedDays.forEach((day) => {
      current.forEach((task) => {
        rows.push({
          user_id: user.id,
          day_of_week: day,
          activity: task.activity,
          start_time: task.start_time,
          end_time: task.end_time,
        });
      });
    });

    await supabase.from("schedules").insert(rows);

    alert("Schedule copied successfully!");
    setShowCopy(false);
    setSelectedDays([]);
  };



  return (
    <div className="container py-5 page-enter">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">📅 Weekly Schedule</h2>
          <p className="text-secondary mb-0">
            Design your perfect weekly routine
          </p>
        </div>

        <button className="btn glass-btn px-4" onClick={goBack}>
          ← Dashboard
        </button>
      </div>

      {/* Day Selector */}
      <div className="glass p-3 mb-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`day-pill ${
                activeDay === day ? "day-pill-active" : ""
              }`}
            >
              {day.slice(0,3)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Activity */}
      <div className="glass p-4 mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="icon-box me-3">
            {editingId ? "✏️" : "➕"}
          </div>
          <div>
            <h4 className="mb-0">
              {editingId ? "Edit Activity" : activeDay}
            </h4>

            <small className="text-secondary">
              {editingId
                ? "Modify this activity"
                : "Add a new activity"}
            </small>
          </div>
        </div>

        <div className="row g-3">

          <div className="col-md-3">
            <label className="form-label fw-semibold">Start</label>
            <input
              type="time"
              className="form-control glass-input"
              value={start}
              onChange={(e)=>setStart(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">End</label>
            <input
              type="time"
              className="form-control glass-input"
              value={end}
              onChange={(e)=>setEnd(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Activity</label>
            <input
              type="text"
              className="form-control glass-input"
              placeholder="Gym, Office, Study..."
              value={activity}
              onChange={(e)=>setActivity(e.target.value)}
            />
          </div>

        </div>

        <button
          className="btn btn-dark mt-4"
          onClick={addTask}
        >
          {editingId ? "💾 Update Activity" : "+ Add Activity"}
        </button>


        {editingId && (
          <button
            className="btn glass mt-2 ms-2 px-4"
            onClick={() => {
              setEditingId(null);
              setActivity("");
              setStart("");
              setEnd("");
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="glass p-4">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="icon-box me-3">🕒</div>
          <div>
            <h4 className="mb-0">{activeDay} Timeline</h4>
            <small className="text-secondary">
              {sortedSchedule.length} Activities
            </small>
          </div>

          <button
            className="btn glass-btn px-1 px-md-3"
            onClick={() => setShowCopy(true)}
          >
            <i className="fas fa-copy me-2"></i>
            Copy
          </button>
        </div>

        {sortedSchedule.length === 0 ? (
          <div className="text-center py-5">
            <div style={{fontSize:"52px"}}>🌤️</div>
            <h5 className="mt-3">No Activities Yet</h5>
            <p className="text-secondary mb-0">
              Build your routine for {activeDay}
            </p>
          </div>
        ):(
          sortedSchedule.map((item) => (
            <div key={item.id} className="timeline-card mb-3">

              <div className="timeline-time">
                {item.start_time.slice(0,5)}
              </div>

              <div className="flex-grow-1">
                <h5 className="mb-1">{item.activity}</h5>
                <small className="text-secondary">
                  {item.start_time.slice(0,5)} — {item.end_time.slice(0,5)}
                </small>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm glass rounded-circle"
                  onClick={() => editTask(item)}
                  style={{
                    width: 38,
                    height: 38,
                  }}
                >
                  ✏️
                </button>

                <button
                  className="btn btn-sm delete-glass rounded-circle"
                  onClick={() => deleteTask(item.id)}
                  style={{
                    width: 38,
                    height: 38,
                  }}
                >
                  🗑
                </button>

              </div>

            </div>
          ))
        )}

      </div>

      {/* ===== Copy Schedule Modal ===== */}
      {showCopy && (
        <div className="copy-overlay">
          <div className="copy-modal glass p-4">
            <h4 className="fw-bold mb-2" style={{ color: "white" }}>
              Copy {activeDay} Schedule
            </h4>

            <p className=" mb-3" style={{ color: "white" }}>
              Select the days that should receive the same timetable.
            </p>

            <div className="row g-2 mb-4">
              {days
                .filter((d) => d !== activeDay)
                .map((day) => (
                  <div className="col-6" key={day}>
                    <label className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDays([...selectedDays, day]);
                          } else {
                            setSelectedDays(
                              selectedDays.filter((d) => d !== day)
                            );
                          }
                        }}
                      />
                      <span>{day}</span>
                    </label>
                  </div>
                ))}
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary flex-fill"
                onClick={copySchedule}
              >
                <i className="fas fa-copy me-2"></i>
                Copy
              </button>

              <button
                className="btn glass-btn flex-fill"
                onClick={() => {
                  setShowCopy(false);
                  setSelectedDays([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}