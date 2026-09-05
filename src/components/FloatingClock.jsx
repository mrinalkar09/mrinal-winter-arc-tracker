import { useEffect, useState } from "react";

export default function FloatingClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const update = () => setTime(new Date());

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const day = time.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="floating-clock d-none">
      <div className="clock-live">
        <span className="live-dot"></span>
        LIVE
      </div>

      <h3>{hours}</h3>

      <p>{day}</p>
    </div>
  );
}