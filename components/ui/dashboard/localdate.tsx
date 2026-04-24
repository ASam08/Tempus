"use client"; // This directive makes it a Client Component

import { useState, useEffect } from "react";

const LocalDateDisplay = () => {
  const [localDate, setLocalTime] = useState("");

  useEffect(() => {
    // This code runs only in the browser, accessing the client's local time
    const updateDate = () => {
      const now = new Date();
      const timeString = now.toLocaleDateString(navigator.language, {
        day: "numeric",
        month: "2-digit",
        year: "2-digit",
      });
      setLocalTime(timeString);
    };

    updateDate(); // Set date initially
    const timerId = setInterval(updateDate, 60000); // Update every second

    return () => clearInterval(timerId); // Cleanup on unmount
  }, []);

  return <span>{localDate}</span>;
};

export default LocalDateDisplay;
