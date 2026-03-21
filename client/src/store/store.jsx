import { configureStore }    from "@reduxjs/toolkit";
import authReducer            from "./slices/authSlice";
import chatReducer            from "./slices/chatSlice";
import taskReducer            from "./slices/taskSlice";
import hrReducer              from "./slices/hrSlice";
import notificationReducer    from "./slices/notificationSlice";
import fileReducer            from "./slices/fileSlice";
import socketMiddleware        from "./middleware/socketMiddleware";
import { authApi }            from "./api/authApi";
import { projectApi }         from "./api/projectApi";
import { taskApi }            from "./api/taskApi";
import { hrApi }              from "./api/hrApi";
import { notificationApi }    from "./api/notificationApi";
import { fileApi }            from "./api/fileApi";
import { analyticsApi }       from "./api/analyticsApi";

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    chat:          chatReducer,
    tasks:         taskReducer,
    hr:            hrReducer,
    notifications: notificationReducer,
    files:         fileReducer,

    [authApi.reducerPath]:         authApi.reducer,
    [projectApi.reducerPath]:      projectApi.reducer,
    [taskApi.reducerPath]:         taskApi.reducer,
    [hrApi.reducerPath]:           hrApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [fileApi.reducerPath]:         fileApi.reducer,
    [analyticsApi.reducerPath]:    analyticsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(projectApi.middleware)
      .concat(taskApi.middleware)
      .concat(hrApi.middleware)
      .concat(notificationApi.middleware)
      .concat(fileApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(socketMiddleware),
});