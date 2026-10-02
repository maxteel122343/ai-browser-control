import { useState, useEffect, useRef } from 'react';
import { Bot, Chrome, Send, Power, PowerOff, Loader2, CheckCircle, XCircle, Terminal, Settings, Save, Key, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api';

const AI_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-flash-latest', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-flash-latest'
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini'
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    defaultModel: 'claude-3-5-sonnet-20241022'
  },
  {
    id: 'groq',
    name: 'Groq (Fast Llama)',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile'
  }
];

function App() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [browserStatus, setBrowserStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // AI Settings
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-flash-latest');

  const historyRef = useRef(null);

  useEffect(() => {
    checkStatus();
    loadSettings();

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const provider = AI_PROVIDERS.find(p => p.id === aiProvider);
    if (provider && !provider.models.includes(aiModel)) {
      setAiModel(provider.defaultModel);
    }
  }, [aiProvider]);

  const loadSettings = () => {
    const savedProvider = localStorage.getItem('ai_provider');
    const savedKey = localStorage.getItem('ai_api_key');
    const savedModel = localStorage.getItem('ai_model');

    if (savedProvider) setAiProvider(savedProvider);
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setAiModel(savedModel);
  };

  const saveSettings = () => {
    localStorage.setItem('ai_provider', aiProvider);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_model', aiModel);
    setShowSettings(false);
    addToHistory('system', `Settings saved! Using ${AI_PROVIDERS.find(p => p.id === aiProvider)?.name} with model ${aiModel}`);
  };

  const checkStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/status`);
      setBrowserStatus(data.browserRunning);
      setCurrentUrl(data.pageUrl);
    } catch (error) {
      setBrowserStatus(false);
    }
  };

  const launchBrowser = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/launch`);
      addToHistory('system', data.message, data.success);
      await checkStatus();
    } catch (error) {
      addToHistory('system', error.message, false);
    }
    setLoading(false);
  };

  const closeBrowser = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/close`);
      addToHistory('system', data.message, data.success);
      await checkStatus();
    } catch (error) {
      addToHistory('system', error.message, false);
    }
    setLoading(false);
  };

  const sendCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    const userCommand = command;
    setCommand('');
    addToHistory('user', userCommand);
    setLoading(true);

    try {
      const headers = {
        'x-api-key': apiKey,
        'x-ai-provider': aiProvider,
        'x-ai-model': aiModel
      };

      const { data } = await axios.post(`${API_URL}/command`, { command: userCommand }, { headers });

      if (data.results) {
        data.results.forEach(result => {
          addToHistory('assistant', result.message || 'Action completed', result.success);
        });
      }
      await checkStatus();
    } catch (error) {
      addToHistory('assistant', error.response?.data?.message || error.message, false);
    }
    setLoading(false);
  };

  const addToHistory = (type, message, success = true) => {
    setHistory(prev => [...prev, { type, message, success, timestamp: new Date() }]);
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === aiProvider);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-6 relative">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-8 h-8 text-primary-500" />
                <h2 className="text-2xl font-bold text-white">AI Settings</h2>
              </div>

              <div className="space-y-4">
                {/* AI Provider Selection */}
                <div>
                  <label className="block text-dark-200 mb-2 text-sm font-medium">AI Provider</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="glass-input w-full pl-10 appearance-none cursor-pointer"
                    >
                      {AI_PROVIDERS.map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-dark-200 mb-2 text-sm font-medium">Model</label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="glass-input w-full appearance-none cursor-pointer"
                  >
                    {currentProvider?.models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-dark-200 mb-2 text-sm font-medium">API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API Key..."
                      className="glass-input w-full pl-10"
                    />
                  </div>
                  <p className="text-xs text-dark-400 mt-2">
                    Your key is stored locally in your browser.
                  </p>
                </div>

                <button
                  onClick={saveSettings}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Bot className="w-10 h-10 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-gradient">AI Browser Control</h1>
              <p className="text-dark-300 text-sm">Powered by {currentProvider?.name}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700/50 transition-all hover:scale-105 group"
          >
            <Settings className="w-6 h-6 text-dark-300 group-hover:text-primary-400 transition-colors" />
          </button>
        </motion.header>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Chrome className="w-8 h-8 text-primary-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-dark-200 font-medium">Browser Status:</span>
                  <span className={`status-badge ${browserStatus ? 'status-success' : 'status-idle'}`}>
                    {browserStatus ? (
                      <><CheckCircle className="w-4 h-4" /> Running</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Stopped</>
                    )}
                  </span>
                </div>
                {currentUrl && (
                  <p className="text-dark-400 text-sm mt-1 truncate max-w-md">{currentUrl}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={launchBrowser}
                disabled={browserStatus || loading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Power className="w-4 h-4" />
                Launch Browser
              </button>
              <button
                onClick={closeBrowser}
                disabled={!browserStatus || loading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PowerOff className="w-4 h-4" />
                Close Browser
              </button>
            </div>
          </div>
        </motion.div>

        {/* Command History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 mb-6 h-96 overflow-hidden flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-semibold text-dark-100">Command History</h2>
          </div>

          <div ref={historyRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
            <AnimatePresence>
              {history.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-dark-400 py-12"
                >
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No commands yet. Configure your AI in Settings, then launch the browser!</p>
                </motion.div>
              ) : (
                history.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: item.type === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`message-bubble ${item.type === 'user' ? 'message-user' :
                        item.type === 'system' ? 'bg-dark-700/60 border border-dark-600' :
                          'message-assistant'
                      } ${!item.success && item.type !== 'user' ? 'border-red-500/50' : ''}`}>
                      <div className="flex items-start gap-2">
                        {item.type === 'assistant' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{item.message}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {item.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Command Input */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={sendCommand}
          className="glass-panel p-6"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter a command (e.g., 'Go to Google and search for AI news')"
              className="glass-input flex-1 text-lg"
              disabled={loading || !browserStatus}
            />
            <button
              type="submit"
              disabled={loading || !browserStatus || !command.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><Send className="w-5 h-5" /> Send</>
              )}
            </button>
          </div>

          {!browserStatus && (
            <p className="text-dark-400 text-sm mt-3">
              ⚠️ Please launch the browser first to send commands
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-dark-700/50">
            <p className="text-dark-300 text-sm mb-2 font-medium">Example commands:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Go to YouTube',
                'Search for "AI tutorials"',
                'Click the first video',
                'Scroll down',
                'Take a screenshot'
              ].map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCommand(example)}
                  className="px-3 py-1.5 bg-dark-800/60 hover:bg-dark-700/60 text-dark-200 text-xs rounded-lg border border-dark-600/50 hover:border-primary-500/50 transition-all"
                  disabled={loading || !browserStatus}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default App;
