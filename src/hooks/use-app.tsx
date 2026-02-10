import { useState, useEffect } from "react";

const useApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const handleRecord = () => {
    setIsRecording(true);
  };

  const handleStop = () => {
    setIsRecording(false);
  };

  const handleLogout = () => {
    console.log("logout");
    console.log(window.recorderAPI.ping()); // "pong"
  };

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  return {
    isRecording,
    elapsed,
    handleRecord,
    handleStop,
    handleLogout,
  };
};

export default useApp;
