import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const Chart = ({ data }) => {
  const [chartData, setChartData] = useState(data);

  useEffect(() => {
    // Load data from API on component mount
    fetch(`/api/data/${chartData.chartType}`)
      .then(res => res.json())
      .then(data => {
        setChartData({ ...chartData, data });
      });
  }, [chartData.chartType]);

  return (
    <div className="chart-container">
      <h2>{chartData.chartTitle}</h2>
      <Line data={chartData.data} options={chartData.options} />
    </div>
  );
};

export default Chart;