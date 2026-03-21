import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOverview: builder.query({
      query: () => "/analytics/overview",
    }),
    getTaskStats: builder.query({
      query: () => "/analytics/tasks",
    }),
    getAttendanceStats: builder.query({
      query: () => "/analytics/attendance",
    }),
    getMySummary: builder.query({
      query: () => "/analytics/my-summary",
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetTaskStatsQuery,
  useGetAttendanceStatsQuery,
  useGetMySummaryQuery,
} = analyticsApi;