import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// What: RTK Query API slice for auth endpoints
// Why: Handles loading/error/success states automatically
//      No need for manual useEffect + useState for API calls
//      Built-in caching — same request won't fire twice

export const authApi = createApi({
  reducerPath: "authApi",

  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,

    // Attach JWT token to every request automatically
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  endpoints: (builder) => ({

    login: builder.mutation({
      query: (credentials) => ({
        url:    "/auth/login",
        method: "POST",
        body:   credentials,
      }),
    }),

    register: builder.mutation({
      query: (userData) => ({
        url:    "/auth/register",
        method: "POST",
        body:   userData,
      }),
    }),

    getMe: builder.query({
      query: () => "/auth/me",
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url:    "/auth/profile",
        method: "PUT",
        body:   data,
      }),
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url:    "/auth/change-password",
        method: "PUT",
        body:   data,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url:    "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;