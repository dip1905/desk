import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  channels:      [],
  activeChannel: null,
  messages:      {},
  dmList:        [],
  onlineUsers:   [],
  typingUsers:   {},
  unreadCounts:  {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChannels:      (state, action) => { state.channels = action.payload; },
    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload;
      if (action.payload) state.unreadCounts[action.payload] = 0;
    },
    setMessages: (state, action) => {
      const { channelId, messages } = action.payload;
      state.messages[channelId]     = messages;
    },
    addMessage: (state, action) => {
      const msg       = action.payload;
      const channelId = msg.channelId || `dm_${msg.senderId}`;
      if (!state.messages[channelId]) state.messages[channelId] = [];
      state.messages[channelId].push(msg);
      if (state.activeChannel !== channelId) {
        state.unreadCounts[channelId] =
          (state.unreadCounts[channelId] || 0) + 1;
      }
    },
    updateMessage: (state, action) => {
      const { messageId, content, editedAt } = action.payload;
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
    setUserOnline:  (state, action) => {
      if (!state.onlineUsers.includes(action.payload))
        state.onlineUsers.push(action.payload);
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
  setChannels, setActiveChannel, setMessages,
  addMessage, updateMessage, deleteMessage,
  setUserOnline, setUserOffline, setTypingUsers, clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;