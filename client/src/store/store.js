import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import taskReducer from "./slices/taskSlice";
import hrReducer from "./slices/hrSlice";
import notificationReducer from "./slices/notificationSlice";
import fileReducer from "./slices/fileSlice";
import socketMiddleware from "./middleware/socketMiddleware";
import { authApi } from "./api/authApi";

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    chat:          chatReducer,
    tasks:         taskReducer,
    hr:            hrReducer,
    notifications: notificationReducer,
    files:         fileReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(socketMiddleware),
});