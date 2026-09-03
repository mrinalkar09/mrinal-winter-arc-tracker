import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function HabitSetup({ goBack }) {
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("Health");
  const [habitType, setHabitType] = useState("daily");
  const [habits, setHabits] = useState([]);

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setHabits(data || []);
  };

  const createHabit = async () => {
    if (!habitName.trim()) {
      alert("Please enter a habit name.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // EDIT MODE
    if (editingId) {
      const { error } = await supabase
        .from("habits")
        .update({
          name: habitName.trim(),
          category,
          habit_type: habitType,
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
      const { data: existing } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", habitName.trim())
        .maybeSingle();

      if (existing) {
        alert("Habit already exists!");
        return;
      }

      const { error } = await supabase
        .from("habits")
        .insert([
          {
            user_id: user.id,
            name: habitName.trim(),
            category,
            habit_type: habitType,
          },
        ]);

      if (error) {
        alert(error.message);
        return;
      }
    }

    // Reset form
    setHabitName("");
    setCategory("Health");
    setHabitType("daily");
    setEditingId(null);

    fetchHabits();
  };

  const editHabit = (habit) => {
    setEditingId(habit.id);
    setHabitName(habit.name);
    setCategory(habit.category);
    setHabitType(habit.habit_type);
  };

  const deleteHabit = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this habit?"
    );

    if (!confirmDelete) return;

    await supabase.from("habits").delete().eq("id", id);

    if (editingId === id) {
      setEditingId(null);
      setHabitName("");
      setCategory("Health");
      setHabitType("daily");
    }

    fetchHabits();
  };

  return (
     <div className="container py-5 page-enter">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1"><i className="fas fa-seedling me-2 text-success"></i>Habit Setup</h2>
          <p className="text-secondary mb-0">
            Build your daily & weekly routine
          </p>
        </div>

        <button
          className="btn px-4 py-2"
          onClick={goBack}
          style={{
            borderRadius: "16px",
            background: "rgba(255,255,255,.18)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,.35)",
            color: "#2B4EFF",
            fontWeight: 600,
          }}
        >
          <i class="fa-solid fa-right-from-bracket" style={{ fontSize: "32px" }}></i>
        </button>
      </div>

      {/* Create Habit Card */}
      <div className="glass p-4 mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="icon-box me-3">
            {editingId ? "✏️" : "➕"}
          </div>
          <div>
            <h4 className="mb-0">
              {editingId ? "Edit Habit" : "Create New Habit"}
            </h4>
            <small className="text-secondary">
              {editingId
                ? "Modify your existing habit"
                : "Add habits you'll track every day"}
            </small>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Habit Name</label>
          <input
            className="form-control glass-input"
            placeholder="Morning Run"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
          />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Category</label>
            <select
              className="form-select glass-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Health</option>
              <option>Study</option>
              <option>Fitness</option>
              <option>Work</option>
              <option>Personal</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Habit Type</label>
            <select
              className="form-select glass-input"
              value={habitType}
              onChange={(e) => setHabitType(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <button
           className="btn btn-primary w-100 py-3 rounded-4 fw-semibold"
           onClick={createHabit}
         >
           {editingId ? "💾 Update Habit" : "+ Create Habit"}
         </button>
         {editingId && (
           <button
             className="btn glass w-100 mt-2 py-3 rounded-4"
             onClick={() => {
               setEditingId(null);
               setHabitName("");
               setCategory("Health");
               setHabitType("daily");
             }}
           >
             Cancel Editing
           </button>
         )}
      </div>

      {/* Habit List */}
      <div className="glass p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-0">Your Habits</h4>
            <small className="text-secondary">
              {habits.length} habits created
            </small>
          </div>

          <div
            className="glass px-3 py-2"
            style={{ borderRadius: "16px", fontWeight: 600 }}
          >
            🎯 {habits.length}
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "50px" }}>📋</div>
            <h5 className="mt-3">No habits yet</h5>
            <p className="text-secondary">
              Create your first habit above.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {habits.map((habit) => (
              <div className="col-md-6" key={habit.id}>
                <div className="habit-item p-3 h-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">{habit.name}</h5>

                      <span className="category-pill me-2">
                        {habit.category}
                      </span>

                      <span className="type-pill">
                        {habit.habit_type}
                      </span>
                    </div>

                  <div className="d-flex gap-2">

                    <button
                      className="btn btn-sm glass rounded-circle"
                      onClick={() => editHabit(habit)}
                      style={{
                        width: 38,
                        height: 38,
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      className="btn btn-sm btn-danger rounded-circle"
                      onClick={() => deleteHabit(habit.id)}
                      style={{
                        width: 38,
                        height: 38,
                      }}
                    >
                      🗑
                    </button>

                  </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}