import { createSlice } from "@reduxjs/toolkit";

// What: Manages all real-time chat state
// Why: Socket.io events update this slice directly
//      via socketMiddleware — no API call needed

const initialState = {
  channels:     [],
  activeChannel: null,
  messages:     {},      // { channelId: [messages array] }
  dmList:       [],
  onlineUsers:  [],
  typingUsers:  {},      // { channelId: [userIds] }
  unreadCounts: {},      // { channelId: count }
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {

    setChannels: (state, action) => {
      state.channels = action.payload;
    },

    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload;
      // Clear unread count when channel is opened
      if (action.payload) {
        state.unreadCounts[action.payload] = 0;
      }
    },

    setMessages: (state, action) => {
      const { channelId, messages } = action.payload;
      state.messages[channelId] = messages;
    },

    // Called when socket receives message:new event
    addMessage: (state, action) => {
      const msg       = action.payload;
      const channelId = msg.channelId || `dm_${msg.senderId}`;

      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }

      state.messages[channelId].push(msg);

      // Increment unread if not currently viewing this channel
      if (state.activeChannel !== channelId) {
        state.unreadCounts[channelId] =
          (state.unreadCounts[channelId] || 0) + 1;
      }
    },

    // Called when socket receives message:updated event
    updateMessage: (state, action) => {
      const { messageId, content, editedAt } = action.payload;

      // Search through all channels to find the message
      Object.keys(state.messages).forEach((channelId) => {
        const index = state.messages[channelId]
          .findIndex((m) => m.id === messageId);

        if (index !== -1) {
          state.messages[channelId][index].content  = content;
          state.messages[channelId][index].isEdited = true;
          state.messages[channelId][index].editedAt = editedAt;
        }
      });
    },

    // Called when socket receives message:deleted event
    deleteMessage: (state, action) => {
      const { messageId } = action.payload;

      Object.keys(state.messages).forEach((channelId) => {
        const index = state.messages[channelId]
          .findIndex((m) => m.id === messageId);

        if (index !== -1) {
          state.messages[channelId][index].isDeleted = true;
          state.messages[channelId][index].content   = null;
        }
      });
    },

    setUserOnline: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },

    setUserOffline: (state, action) => {
      state.onlineUsers = state.onlineUsers
        .filter((id) => id !== action.payload);
    },

    setTypingUsers: (state, action) => {
      const { channelId, users } = action.payload;
      state.typingUsers[channelId] = users;
    },

    clearChat: (state) => {
      state.channels      = [];
      state.activeChannel = null;
      state.messages      = {};
      state.onlineUsers   = [];
      state.unreadCounts  = {};
    },
  },
});

export const {
  setChannels,
  setActiveChannel,
  setMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  setUserOnline,
  setUserOffline,
  setTypingUsers,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;