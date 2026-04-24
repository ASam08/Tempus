"use client"; // This directive makes it a Client Component

import { useState, useEffect } from "react";

const LocalTimeDisplay = () => {
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    // This code runs only in the browser, accessing the client's local time
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
      setLocalTime(timeString);
    };

    updateTime(); // Set time initially
    const timerId = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(timerId); // Cleanup on unmount
  }, []);

  return <span>{localTime}</span>;
};

export default LocalTimeDisplay;
