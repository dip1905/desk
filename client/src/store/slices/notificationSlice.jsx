import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount:   0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {

    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount   = action.payload
        .filter((n) => !n.isRead).length;
    },

    // Called by socketMiddleware when notification:new arrives
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },

    markAsRead: (state, action) => {
      const index = state.notifications
        .findIndex((n) => n.id === action.payload);
      if (index !== -1 && !state.notifications[index].isRead) {
        state.notifications[index].isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount   = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} = notificationSlice.actions;

export const selectUnreadCount   = (state) => state.notifications.unreadCount;
export const selectNotifications = (state) => state.notifications.notifications;

export default notificationSlice.reducer;