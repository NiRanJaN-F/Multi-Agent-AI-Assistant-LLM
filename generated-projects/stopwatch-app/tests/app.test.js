import test from 'node:test';
import assert from 'node:assert/strict';

// Helper function to simulate time formatting logic used in Display component
function formatTime(ms) {
  if (ms < 0) ms = 0;
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    centiseconds: String(centiseconds).padStart(2, '0')
  };
}

// Helper function to calculate lap analytics (fastest, slowest, average)
function calculateLapAnalytics(laps) {
  if (!laps || laps.length === 0) return { fastest: null, slowest: null, average: 0 };
  
  let min = laps[0].lapTime;
  let max = laps[0].lapTime;
  let sum = 0;

  laps.forEach(lap => {
    if (lap.lapTime < min) min = lap.lapTime;
    if (lap.lapTime > max) max = lap.lapTime;
    sum += lap.lapTime;
  });

  return {
    fastest: min,
    slowest: max,
    average: Math.round(sum / laps.length)
  };
}

test('Stopwatch Time Formatting Unit Tests', async (t) => {
  await t.test('formats 0 milliseconds correctly', () => {
    const formatted = formatTime(0);
    assert.deepEqual(formatted, {
      hours: '00',
      minutes: '00',
      seconds: '00',
      centiseconds: '00'
    });
  });

  await t.test('formats seconds and centiseconds correctly', () => {
    // 5550 ms = 5 seconds and 55 centiseconds
    const formatted = formatTime(5550);
    assert.deepEqual(formatted, {
      hours: '00',
      minutes: '00',
      seconds: '05',
      centiseconds: '55'
    });
  });

  await t.test('formats minutes, seconds, and centiseconds correctly', () => {
    // 125000 ms = 2 minutes, 5 seconds, 00 centiseconds
    const formatted = formatTime(125000);
    assert.deepEqual(formatted, {
      hours: '00',
      minutes: '02',
      seconds: '05',
      centiseconds: '00'
    });
  });

  await t.test('formats hours, minutes, seconds, and centiseconds correctly', () => {
    // 3661050 ms = 1 hour, 1 minute, 1 second, 5 centiseconds
    const formatted = formatTime(3661050);
    assert.deepEqual(formatted, {
      hours: '01',
      minutes: '01',
      seconds: '01',
      centiseconds: '05'
    });
  });

  await t.test('handles negative milliseconds gracefully by clamping to 0', () => {
    const formatted = formatTime(-500);
    assert.deepEqual(formatted, {
      hours: '00',
      minutes: '00',
      seconds: '00',
      centiseconds: '00'
    });
  });
});

test('Stopwatch Lap Analytics Unit Tests', async (t) => {
  await t.test('returns null/zero for empty laps array', () => {
    const analytics = calculateLapAnalytics([]);
    assert.deepEqual(analytics, {
      fastest: null,
      slowest: null,
      average: 0
    });
  });

  await t.test('correctly identifies fastest, slowest, and average for single lap', () => {
    const laps = [{ lapNumber: 1, lapTime: 1500, totalTime: 1500 }];
    const analytics = calculateLapAnalytics(laps);
    assert.deepEqual(analytics, {
      fastest: 1500,
      slowest: 1500,
      average: 1500
    });
  });

  await t.test('correctly identifies fastest, slowest, and average for multiple laps', () => {
    const laps = [
      { lapNumber: 1, lapTime: 2000, totalTime: 2000 },
      { lapNumber: 2, lapTime: 1000, totalTime: 3000 },
      { lapNumber: 3, lapTime: 3000, totalTime: 6000 }
    ];
    const analytics = calculateLapAnalytics(laps);
    assert.deepEqual(analytics, {
      fastest: 1000,
      slowest: 3000,
      average: 2000
    });
  });
});

test('Stopwatch State Integration Workflow Simulation', async (t) => {
  await t.test('simulates stopwatch start, lap recording, pause, and reset workflow', () => {
    let state = {
      time: 0,
      isRunning: false,
      hasStarted: false,
      laps: []
    };

    // Action: Start
    state = {
      ...state,
      isRunning: true,
      hasStarted: true
    };
    assert.equal(state.isRunning, true);
    assert.equal(state.hasStarted, true);

    // Simulate time passing (e.g., 5000ms)
    state.time = 5000;

    // Action: Record Lap
    const newLap = {
      lapNumber: state.laps.length + 1,
      lapTime: state.time,
      totalTime: state.time
    };
    state.laps = [newLap, ...state.laps];

    assert.equal(state.laps.length, 1);
    assert.equal(state.laps[0].lapTime, 5000);

    // Simulate more time passing (+3000ms -> total 8000ms)
    state.time = 8000;
    const secondLapTime = state.time - state.laps[0].totalTime;
    const secondLap = {
      lapNumber: state.laps.length + 1,
      lapTime: secondLapTime,
      totalTime: state.time
    };
    state.laps = [secondLap, ...state.laps];

    assert.equal(state.laps.length, 2);
    assert.equal(state.laps[0].lapTime, 3000);

    // Action: Pause
    state = {
      ...state,
      isRunning: false
    };
    assert.equal(state.isRunning, false);
    assert.equal(state.hasStarted, true); // retains started state

    // Action: Reset
    state = {
      time: 0,
      isRunning: false,
      hasStarted: false,
      laps: []
    };
    assert.equal(state.time, 0);
    assert.equal(state.isRunning, false);
    assert.equal(state.hasStarted, false);
    assert.equal(state.laps.length, 0);
  });
});