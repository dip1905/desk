import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const hrApi = createApi({
  reducerPath: "hrApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Employee", "Leave", "Attendance"],
  endpoints: (builder) => ({
    // Employees
    getEmployees: builder.query({
      query: (params = {}) => ({ url: "/employees", params }),
      providesTags: ["Employee"],
    }),
    getEmployeeById: builder.query({
      query: (id) => `/employees/${id}`,
      providesTags: ["Employee"],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: "/employees", method: "POST", body: data,
      }),
      invalidatesTags: ["Employee"],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/employees/${id}`, method: "PUT", body: data,
      }),
      invalidatesTags: ["Employee"],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`, method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),

    // Leaves
    getLeaves: builder.query({
      query: (params = {}) => ({ url: "/leaves", params }),
      providesTags: ["Leave"],
    }),
    applyLeave: builder.mutation({
      query: (data) => ({
        url: "/leaves", method: "POST", body: data,
      }),
      invalidatesTags: ["Leave"],
    }),
    updateLeaveStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/leaves/${id}/status`, method: "PATCH", body: data,
      }),
      invalidatesTags: ["Leave"],
    }),
    cancelLeave: builder.mutation({
      query: (id) => ({
        url: `/leaves/${id}`, method: "DELETE",
      }),
      invalidatesTags: ["Leave"],
    }),

    // Attendance
    getAttendance: builder.query({
      query: (params = {}) => ({ url: "/attendance", params }),
      providesTags: ["Attendance"],
    }),
    checkIn: builder.mutation({
      query: () => ({
        url: "/attendance/checkin", method: "POST",
      }),
      invalidatesTags: ["Attendance"],
    }),
    checkOut: builder.mutation({
      query: () => ({
        url: "/attendance/checkout", method: "POST",
      }),
      invalidatesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useCancelLeaveMutation,
  useGetAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
} = hrApi;