import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface NotificationPayload {
  status?: string;
  message?: string;
  sellerId?: string;
  storeName?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: string;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}

export const useNotifications = (enabled: boolean = true) => {
  return useQuery<UserNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data.data;
    },
    enabled,
    refetchInterval: 30000, // Poll notifications every 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
