import { useState, useRef, useCallback, useEffect } from 'react';

export function useStopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  
  const startTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);
  const requestRef = useRef(null);

  const updateTimer = useCallback(() => {
    if (!isRunning) return;
    
    const now = performance.now();
    const elapsed = accumulatedTimeRef.now ? (now - startTimeRef.current) + accumulatedTimeRef.current : now - startTimeRef.current;
    
    // If using precise accumulation:
    const currentTime = Date.now() - startTimeRef.current;
    setTime(currentTime);
    
    requestRef.current = requestAnimationFrame(updateTimer);
  }, [isRunning]);

  // High precision timestamp based stopwatch loop
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - accumulatedTimeRef.current;
      
      const intervalId = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10); // Update every 10ms for smooth centisecond rendering

      return () => clearInterval(intervalId);
    } else {
      accumulatedTimeRef.current = time;
    }
  }, [isRunning]);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      accumulatedTimeRef.current = time;
    }
  }, [isRunning, time]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = 0;
  }, []);

  const lap = useCallback(() => {
    if (!isRunning && time === 0) return;

    setLaps((prevLaps) => {
      const lastLapTotal = prevLaps.length > 0 ? prevLaps[0].totalTime : 0;
      const lapTime = time - lastLapTotal;

      const newLap = {
        id: prevLaps.length + 1,
        lapTime: lapTime,
        totalTime: time,
      };

      // Unshift to put the most recent lap at the top of the table
      return [newLap, ...prevLaps];
    });
  }, [isRunning, time]);

  return {
    time,
    isRunning,
    laps,
    start,
    pause,
    reset,
    lap,
  };
}