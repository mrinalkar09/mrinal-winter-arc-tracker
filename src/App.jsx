import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Home from "./pages/Home";
import Toast from "./components/Toast";

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Global Toast State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
  }

  async function handleAuth() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: !isLogin,
        data: { full_name: name },
        emailRedirectTo: "http://localhost:5173",
      },
    });

    if (error) {
      setToast({
        type: "error",
        title: "Authentication Failed",
        message: error.message,
      });
    } else {
      setToast({
        type: "success",
        title: "Email Sent",
        message: "Check your email for the login link.",
      });
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // Logged In
  if (user) {
    return (
      <>
        <Toast toast={toast} onClose={() => setToast(null)} />

        <Home
          user={user}
          logout={logout}
          showToast={setToast}
        />
      </>
    );
  }

  // Login Page
  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="card p-4 shadow-sm" style={{ width: 420 }}>
          <h2 className="text-center fw-bold">Winter Arc</h2>

          <p className="text-center text-secondary">
            Build Discipline • Track Growth
          </p>

          <div className="d-flex bg-light rounded-pill p-1 mb-3">
            <button
              className={`btn w-50 rounded-pill ${
                isLogin ? "btn-dark text-white" : ""
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>

            <button
              className={`btn w-50 rounded-pill ${
                !isLogin ? "btn-dark text-white" : ""
              }`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {!isLogin && (
            <input
              className="form-control mb-3"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            className="form-control mb-3"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn btn-dark" onClick={handleAuth}>
            {isLogin ? "Login" : "Create Account"}
          </button>

          {message && (
            <div className="alert alert-light mt-3 mb-0">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;