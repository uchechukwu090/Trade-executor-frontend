/**
 * UNIFIED TRADING DASHBOARD
 * =========================
 * React frontend for the Unified Trading System
 * Features:
 * - Symbol selection with engine picker (Anso/FRIT/Both)
 * - Timer configuration for auto-analysis
 * - Live accuracy leaderboard
 * - Paper trade monitor
 * - Session awareness display
 * - Mobile responsive
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ==================== COMPONENTS ====================

const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-900 text-blue-200',
    green: 'bg-green-900 text-green-200',
    red: 'bg-red-900 text-red-200',
    yellow: 'bg-yellow-900 text-yellow-200',
    purple: 'bg-purple-900 text-purple-200'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

const Button = ({ onClick, children, variant = 'primary', disabled = false, className = '' }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-gray-600 hover:bg-gray-800 text-gray-300'
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// ==================== MAIN APP ====================

export default function UnifiedTradingDashboard() {
  const [activeTab, setActiveTab] = useState('trade');
  const [symbol, setSymbol] = useState('EURUSD');
  const [engine, setEngine] = useState('both');
  const [timeframe, setTimeframe] = useState('1h');
  const [riskPercent, setRiskPercent] = useState(1);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [autoExecute, setAutoExecute] = useState(false);

  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [activeTimers, setActiveTimers] = useState([]);
  const [accuracy, setAccuracy] = useState({});
  const [paperTrades, setPaperTrades] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  // Polling
  useEffect(() => {
    const poll = () => {
      fetch(`${API_BASE}/trade/auto/timers`).then(r => r.json()).then(d => setActiveTimers(d.active_timers || []));
      fetch(`${API_BASE}/accuracy/leaderboard`).then(r => r.json()).then(d => setAccuracy(d.leaderboard || {}));
      fetch(`${API_BASE}/trades/paper?status=open`).then(r => r.json()).then(d => setPaperTrades(d.trades || []));
      fetch(`${API_BASE}/market/session`).then(r => r.json()).then(d => setSessionInfo(d));
      fetch(`${API_BASE}/engines/status`).then(r => r.json()).then(d => setSystemStatus(d));
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, []);

  const analyzeNow = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/trade/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          engine,
          timeframe,
          risk_percent: riskPercent,
          auto_execute: autoExecute
        })
      });
      const data = await res.json();
      setLastResult(data);
    } catch (err) {
      setLastResult({ status: 'error', error: err.message });
    }
    setLoading(false);
  }, [symbol, engine, timeframe, riskPercent, autoExecute]);

  const startTimer = useCallback(async () => {
    const res = await fetch(`${API_BASE}/trade/auto/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, engine, timeframe, interval_minutes: timerMinutes, risk_percent: riskPercent })
    });
    const data = await res.json();
    alert(data.status === 'timer_started' ? `Auto-analysis started for ${symbol} every ${timerMinutes}min` : data.status);
  }, [symbol, engine, timeframe, timerMinutes, riskPercent]);

  const stopTimer = useCallback(async () => {
    const res = await fetch(`${API_BASE}/trade/auto/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    });
    const data = await res.json();
    alert(data.status);
  }, [symbol]);

  const resolvePaper = async (tradeId, outcome) => {
    await fetch(`${API_BASE}/trades/paper/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade_id: tradeId, outcome })
    });
    // Refresh
    const res = await fetch(`${API_BASE}/trades/paper?status=open`);
    const data = await res.json();
    setPaperTrades(data.trades || []);
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
              UT
            </div>
            <div>
              <h1 className="text-xl font-bold">Unified Trading System</h1>
              <p className="text-xs text-gray-500">Anso Vision + FRIT AI → OANDA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {systemStatus && (
              <>
                <Badge color={systemStatus.anso?.status === 'healthy' ? 'green' : 'red'}>
                  Anso {systemStatus.anso?.status === 'healthy' ? '●' : '○'}
                </Badge>
                <Badge color={systemStatus.frit?.status ? 'green' : 'red'}>
                  FRIT {systemStatus.frit?.status ? '●' : '○'}
                </Badge>
              </>
            )}
            <Badge color="purple">{systemStatus?.unified?.mode || 'PAPER'}</Badge>
          </div>
        </div>
      </header>

      {/* Session Bar */}
      {sessionInfo && (
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-4 text-sm">
            <span className="text-gray-400">Active Sessions:</span>
            {sessionInfo.sessions?.map(s => (
              <Badge key={s} color={s === 'london' || s === 'new_york' ? 'green' : 'blue'}>
                {s.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
            {sessionInfo.isOverlap && <Badge color="yellow">OVERLAP 🔥</Badge>}
            <span className="text-gray-500 ml-auto">
              Best pairs: {sessionInfo.bestFor?.slice(0, 4).join(', ')}
            </span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN - Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ⚙️ Trade Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  placeholder="EURUSD"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Signal Engine</label>
                <select
                  value={engine}
                  onChange={e => setEngine(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                >
                  <option value="both">🤖 Both (Collision Resolver)</option>
                  <option value="anso">📊 Anso Vision Only</option>
                  <option value="frit">🧠 FRIT AI Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {engine === 'both' ? 'Uses accuracy-weighted collision resolution when engines disagree' : 
                   engine === 'anso' ? 'Uses only Anso Vision confluence engine' : 
                   'Uses only FRIT AI enhanced pipeline with GSRI/ACP'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={e => setTimeframe(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="5m">5M</option>
                    <option value="15m">15M</option>
                    <option value="1h">1H</option>
                    <option value="4h">4H</option>
                    <option value="1d">1D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Risk %</label>
                  <input
                    type="number"
                    value={riskPercent}
                    onChange={e => setRiskPercent(parseFloat(e.target.value))}
                    min="0.1"
                    max="5"
                    step="0.1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoExecute"
                  checked={autoExecute}
                  onChange={e => setAutoExecute(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600"
                />
                <label htmlFor="autoExecute" className="text-sm text-gray-300">
                  Auto-execute signals (paper mode)
                </label>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <Button onClick={analyzeNow} disabled={loading} className="w-full">
                  {loading ? 'Analyzing...' : '🔍 Analyze Now'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">⏱️ Auto Timer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Interval (minutes)</label>
                <input
                  type="number"
                  value={timerMinutes}
                  onChange={e => setTimerMinutes(parseInt(e.target.value))}
                  min="5"
                  max="240"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={startTimer} variant="success" className="flex-1">Start</Button>
                <Button onClick={stopTimer} variant="danger" className="flex-1">Stop</Button>
              </div>
              {activeTimers.length > 0 && (
                <div className="text-sm text-gray-400">
                  Active: {activeTimers.map(t => t.symbol).join(', ')}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* MIDDLE COLUMN - Results */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <h2 className="text-lg font-semibold mb-4">📈 Last Analysis</h2>

            {lastResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <Badge color={
                    lastResult.status === 'executed' ? 'green' :
                    lastResult.status === 'signal_generated' ? 'blue' :
                    lastResult.status === 'blocked' ? 'yellow' : 'red'
                  }>
                    {lastResult.status}
                  </Badge>
                </div>

                {lastResult.signal && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Direction</span>
                      <span className={`font-bold ${lastResult.signal.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {lastResult.signal.direction}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Confidence</span>
                      <span className="font-mono">{(lastResult.signal.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Entry</span>
                      <span className="font-mono">{lastResult.signal.entry?.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">SL</span>
                      <span className="font-mono text-red-400">{lastResult.signal.sl?.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">TP</span>
                      <span className="font-mono text-green-400">{lastResult.signal.tp?.toFixed(5)}</span>
                    </div>

                    {lastResult.regime && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Regime</span>
                        <Badge color="purple">{lastResult.regime.type}</Badge>
                      </div>
                    )}

                    {lastResult.resolution && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Engine Resolution</p>
                        <p className="text-sm">{lastResult.resolution.reasoning}</p>
                        {lastResult.resolution.engine_weights && (
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="text-blue-400">Anso WR: {(lastResult.resolution.engine_weights.anso * 100).toFixed(0)}%</span>
                            <span className="text-purple-400">FRIT WR: {(lastResult.resolution.engine_weights.frit * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {lastResult.execution && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Execution</p>
                        <p className="text-sm">{lastResult.execution.mode} — {lastResult.execution.tradeId || lastResult.execution.error}</p>
                      </div>
                    )}
                  </>
                )}

                {lastResult.reason && (
                  <div className="p-3 bg-yellow-900/30 border border-yellow-800 rounded-lg text-sm text-yellow-200">
                    {lastResult.reason}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Click "Analyze Now" to see results
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN - Monitoring */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4">🏆 Accuracy Leaderboard</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(accuracy).length === 0 ? (
                <p className="text-gray-500 text-sm">No accuracy data yet. Run some trades!</p>
              ) : (
                Object.entries(accuracy).map(([sym, data]) => (
                  <div key={sym} className="p-2 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">{sym}</span>
                      <Badge color={data.recommendation === 'anso' ? 'blue' : data.recommendation === 'frit' ? 'purple' : 'yellow'}>
                        {data.recommendation === 'insufficient_data' ? 'Testing...' : `${data.recommendation.toUpperCase()} wins`}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-blue-400">
                        Anso: {data.anso.winRate}% ({data.anso.wins}W/{data.anso.losses}L)
                      </div>
                      <div className="text-purple-400">
                        FRIT: {data.frit.winRate}% ({data.frit.wins}W/{data.frit.losses}L)
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">📋 Open Paper Trades</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {paperTrades.length === 0 ? (
                <p className="text-gray-500 text-sm">No open paper trades</p>
              ) : (
                paperTrades.map(trade => (
                  <div key={trade.id} className="p-2 bg-gray-800 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${trade.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.direction} {trade.symbol}
                      </span>
                      <span className="text-gray-400">{trade.source}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Entry: {trade.entry} | SL: {trade.sl} | TP: {trade.tp}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => resolvePaper(trade.id, 'win')} className="px-2 py-1 bg-green-900 text-green-200 rounded text-xs">Win</button>
                      <button onClick={() => resolvePaper(trade.id, 'loss')} className="px-2 py-1 bg-red-900 text-red-200 rounded text-xs">Loss</button>
                      <button onClick={() => resolvePaper(trade.id, 'breakeven')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs">BE</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">📊 System Stats</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Trades</span>
                <span>{systemStatus?.unified?.daily_count || 0} / {systemStatus?.global?.max_daily_trades || 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Timers</span>
                <span>{activeTimers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Paper Trades</span>
                <span>{paperTrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mode</span>
                <Badge color="yellow">{systemStatus?.unified?.mode || 'PAPER'}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
