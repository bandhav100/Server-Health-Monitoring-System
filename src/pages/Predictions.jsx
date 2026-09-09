import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import ChartCard from '../components/UI/ChartCard';
import PredictionCard from '../components/UI/PredictionCard';
import { useDashboard } from '../context/DashboardContext';
import api, { unwrap } from '../api';

const Predictions = () => {
  const { selectedServer } = useDashboard();
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (!selectedServer?.id) return; Promise.all([api.get(`/predictions/${selectedServer.id}`), api.get(`/predictions/${selectedServer.id}/forecast`), api.get(`/predictions/${selectedServer.id}/anomalies`)]).then(([p, f, a]) => { setPrediction(unwrap(p)); setForecast(unwrap(f)); setAnomalies(unwrap(a)); }).catch((error) => setMessage(error.response?.data?.message || 'Predictions unavailable')); }, [selectedServer?.id]);
  const retrain = async () => { await api.post('/predictions/retrain'); setMessage('Model retraining initiated'); };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-emerald-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Predictions</h1>
          <p className="text-gray-400 text-sm">AI-powered forecasts and trends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {prediction ? [['Health Score', prediction.health_score], ['CPU Forecast', prediction.cpu_forecast], ['RAM Forecast', prediction.ram_forecast], ['Anomaly Score', prediction.anomaly_score]].map(([title, value]) => { const numericValue = Array.isArray(value) ? value.at(-1)?.value ?? value.at(-1) : value; return <PredictionCard key={title} prediction={{ id: title, title, predicted: numericValue, timeframe: prediction.source }} />; }) : <p className="text-gray-400">Loading predictions...</p>}
      </div>

      <ChartCard title="Detailed Forecasts" subtitle="Extended predictions for next 24 hours">
        {message && <p className="text-yellow-400 mb-3">{message}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300"><pre className="overflow-auto">{JSON.stringify(forecast, null, 2)}</pre><pre className="overflow-auto">{JSON.stringify(anomalies, null, 2)}</pre></div>
        <button className="btn-primary mt-4" onClick={retrain}>Retrain Models</button>
      </ChartCard>
    </motion.div>
  );
};

export default Predictions;
