import { useEffect, useCallback } from 'react';
import useAppStore from '../zustand/store';
import { useNotificationStore } from '../zustand/notificationStore';
import { duneAlertService } from '../services/duneAlertService';

export function useNotifications() {
  const address = useAppStore((s) => s.address);
  
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
    loadNotifications,
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
  } = useNotificationStore();

  // Load from DB on mount or when address changes
  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, address]);

  // Determine if user is admin (using the Stacks deployer address as a reference)
  const isAdmin = address?.toLowerCase() === 'sp34mn3dmm07bnawyjshts4b08t8jrvk8at810x1b'.toLowerCase();

  // Start polling when wallet is connected
  useEffect(() => {
    if (address) {
      // Poll every 30 seconds for quick testing/feedback
      duneAlertService.startPolling(address, isAdmin, 30000);
    } else {
      duneAlertService.stopPolling();
    }

    return () => {
      duneAlertService.stopPolling();
    };
  }, [address, isAdmin]);

  // Manual trigger helper for testing / debugging
  const triggerDemoAlert = useCallback(async () => {
    if (!address) return;
    console.log('[useNotifications] Manually triggering demo alert evaluations...');
    const mockEvents = duneAlertService.generateMockEvents(address);
    // Force evaluation with admin rights to verify all alerts
    await duneAlertService.evaluateAlerts(mockEvents, address, true);
  }, [address]);

  return {
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
  };
}

export default useNotifications;
