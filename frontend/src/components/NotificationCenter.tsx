import { useState, useEffect } from 'react';
import { 
  Bell, X, Trash2, Check, CheckCheck, 
  AlertCircle, ShieldAlert, Info, BellOff, VolumeX,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { DUNE_ALERTS_CONFIG } from '../config/duneAlerts';

interface ToastItem {
  id: string;
  title: string;
  body: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    farcasterPushEnabled,
    farcasterPushToken,
    farcasterPushUrl,
    enabledAlerts,
    enabledChannels,
    webhookUrl,
    quietHours,
    isAdmin,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    toggleAlert,
    toggleChannel,
    setWebhookUrl,
    setQuietHours,
    setFarcasterPushDetails,
    setFarcasterPushEnabled,
    triggerDemoAlert,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [prevCount, setPrevCount] = useState(0);

  // Monitor notifications to show floating toasts for new arrivals
  useEffect(() => {
    if (notifications.length > 0) {
      // Find new unread notifications that arrived since the last check
      const currentUnread = notifications.filter(n => !n.read);
      if (currentUnread.length > prevCount) {
        const newlyArrived = notifications[0]; // The latest one
        if (newlyArrived && !newlyArrived.read) {
          // Add a toast
          const newToast: ToastItem = {
            id: newlyArrived.id,
            title: newlyArrived.title,
            body: newlyArrived.body,
            severity: newlyArrived.severity,
          };
          setToasts(prev => [newToast, ...prev].slice(0, 3)); // Max 3 toasts at a time

          // Auto-remove toast after 4 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
          }, 4000);
        }
      }
      setPrevCount(currentUnread.length);
    } else {
      setPrevCount(0);
    }
  }, [notifications, prevCount]);

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Chessxu Alerts',
          content: '🔔 Test notification from Chessxu Alerting Pipeline!'
        })
      });
      alert(response.ok ? 'Test webhook sent successfully!' : 'Failed to send test webhook.');
    } catch (e) {
      alert('Error sending webhook: ' + String(e));
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert size={16} className="text-red-400" />;
      case 'high':
        return <AlertCircle size={16} className="text-orange-400" />;
      case 'medium':
        return <Info size={16} className="text-blue-400" />;
      default:
        return <Info size={16} className="text-slate-400" />;
    }
  };

  return (
    <>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/80 shadow-lg active:scale-95 flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Toast Container */}
      <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl flex items-start gap-3 border backdrop-blur-xl animate-slide-in-right ${
              toast.severity === 'critical' ? 'bg-red-950/80 border-red-500/50' : 
              toast.severity === 'high' ? 'bg-orange-950/80 border-orange-500/50' : 
              'bg-slate-900/90 border-indigo-500/50'
            }`}
          >
            <div className="mt-0.5">{getSeverityIcon(toast.severity)}</div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{toast.body}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Slide-out Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[99998] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Panel Container */}
          <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 animate-slide-in-right">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-indigo-400" />
                <h2 className="text-lg font-black text-white tracking-tight">Notification Center</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/20">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'alerts'
                    ? 'border-indigo-500 text-white bg-slate-800/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Alerts ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'settings'
                    ? 'border-indigo-500 text-white bg-slate-800/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Preferences & Channels
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'alerts' ? (
                /* ALERTS TAB */
                <div className="flex flex-col h-full">
                  {notifications.length > 0 && (
                    <div className="flex justify-between items-center mb-4">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCheck size={14} />
                        Mark all read
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={14} />
                        Clear all
                      </button>
                    </div>
                  )}

                  {notifications.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-700/50 mb-4">
                        <BellOff size={28} />
                      </div>
                      <h3 className="text-sm font-bold text-white">No notifications yet</h3>
                      <p className="text-xs text-slate-400 mt-2 max-w-xs">
                        Subscribe to alert definitions and start playing to trigger Dune-powered real-time notifications.
                      </p>
                      
                      {/* Demo button */}
                      <button
                        onClick={triggerDemoAlert}
                        className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95"
                      >
                        <Sparkles size={14} />
                        <span>Trigger Demo Alert</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                            notif.read 
                              ? 'bg-slate-800/20 border-slate-800/80 text-slate-400' 
                              : 'bg-slate-800/60 border-slate-700 text-white shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(notif.severity)}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityStyles(notif.severity)}`}>
                                {notif.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="p-1 hover:bg-slate-700 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                                  title="Delete alert"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-bold">{notif.title}</h4>
                            <p className="text-xs mt-1 text-slate-300 leading-relaxed">{notif.body}</p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-800/50 pt-2">
                            <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                            <span>Query #{DUNE_ALERTS_CONFIG[notif.type]?.queryId}</span>
                          </div>
                        </div>
                      ))}

                      {/* Demo button at bottom of list too */}
                      <button
                        onClick={triggerDemoAlert}
                        className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        <Sparkles size={14} className="text-yellow-400" />
                        <span>Trigger More Demo Alerts</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* PREFERENCES & CHANNELS TAB */
                <div className="flex flex-col gap-6">
                  
                  {/* Channels Settings */}
                  <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-3">Delivery Channels</h3>
                    
                    <div className="flex flex-col gap-3">
                      {/* In-App */}
                      <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            In-App Notifications
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Toasts and slide-out center notification list</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enabledChannels.in_app ?? true}
                          onChange={() => toggleChannel('in_app')}
                          className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                        />
                      </label>

                      {/* Farcaster Frame Push */}
                      <div className="border-t border-slate-800/60 my-1"></div>
                      <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <div>
                          <div className="text-sm font-bold text-white">Farcaster Frame Push</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Push notifications through Farcaster V2 client</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enabledChannels.farcaster_push ?? true}
                          onChange={() => toggleChannel('farcaster_push')}
                          className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                        />
                      </label>

                      {/* Mock Farcaster Push Registry */}
                      {enabledChannels.farcaster_push && (
                        <div className="mt-2 pl-2 border-l-2 border-indigo-500 bg-slate-800/20 p-3 rounded-lg flex flex-col gap-2">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-300">Enable Farcaster Client Push</span>
                            <input
                              type="checkbox"
                              checked={farcasterPushEnabled}
                              onChange={(e) => setFarcasterPushEnabled(e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-indigo-500 bg-slate-900 border-slate-700"
                            />
                          </label>
                          
                          {farcasterPushEnabled && (
                            <div className="flex flex-col gap-1.5 mt-1">
                              <input
                                type="text"
                                placeholder="Push Token"
                                value={farcasterPushToken || ''}
                                onChange={(e) => setFarcasterPushDetails(e.target.value, farcasterPushUrl || 'https://api.farcaster.xyz/v2/notifications')}
                                className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg p-1.5 text-slate-300"
                              />
                              <input
                                type="text"
                                placeholder="Push Server URL"
                                value={farcasterPushUrl || ''}
                                onChange={(e) => setFarcasterPushDetails(farcasterPushToken || 'mock-token-123', e.target.value)}
                                className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg p-1.5 text-slate-300"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Webhook (Admin Only viewable, but configurable) */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-slate-800/60 my-1"></div>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                              <div>
                                <div className="text-sm font-bold text-white">Discord/Slack Webhook</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">POST JSON to external URL for critical events</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={enabledChannels.webhook ?? false}
                                onChange={() => toggleChannel('webhook')}
                                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                              />
                            </label>
                            
                            {enabledChannels.webhook && (
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Discord Webhook URL"
                                  value={webhookUrl}
                                  onChange={(e) => setWebhookUrl(e.target.value)}
                                  className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300"
                                />
                                <button
                                  onClick={handleTestWebhook}
                                  disabled={!webhookUrl}
                                  className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-400 hover:text-indigo-300 px-3 rounded-lg font-bold disabled:opacity-50"
                                >
                                  Test
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quiet Hours Settings */}
                  <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Quiet Hours</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quietHours.enabled}
                          onChange={(e) => setQuietHours({ enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                      </label>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3">
                      Mute all notifications during a specific time block.
                    </p>

                    {quietHours.enabled && (
                      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-850">
                        <VolumeX size={16} className="text-indigo-400" />
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                          <span>From:</span>
                          <select
                            value={quietHours.startHour}
                            onChange={(e) => setQuietHours({ startHour: parseInt(e.target.value) })}
                            className="bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 focus:outline-none"
                          >
                            {Array.from({ length: 24 }).map((_, h) => (
                              <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                            ))}
                          </select>
                          <span>To:</span>
                          <select
                            value={quietHours.endHour}
                            onChange={(e) => setQuietHours({ endHour: parseInt(e.target.value) })}
                            className="bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 focus:outline-none"
                          >
                            {Array.from({ length: 24 }).map((_, h) => (
                              <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alert Filter Toggles */}
                  <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-3">Alert Definitions</h3>
                    <div className="flex flex-col gap-3">
                      {Object.values(DUNE_ALERTS_CONFIG).map((def) => {
                        // Skip admin events if current user is not admin
                        if (def.defaultSeverity === 'critical' && !isAdmin) return null;
                        
                        return (
                          <label
                            key={def.id}
                            className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <div className="flex-1 pr-4">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {def.name}
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${getSeverityStyles(def.defaultSeverity)}`}>
                                  {def.defaultSeverity}
                                </span>
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 block leading-normal">{def.description}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={enabledAlerts[def.id] ?? true}
                              onChange={() => toggleAlert(def.id)}
                              className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700 mt-0.5"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
