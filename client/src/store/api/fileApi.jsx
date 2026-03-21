import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const fileApi = createApi({
  reducerPath: "fileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["File"],
  endpoints: (builder) => ({
    getFiles: builder.query({
      query: (params = {}) => ({ url: "/files", params }),
      providesTags: ["File"],
    }),
    uploadFile: builder.mutation({
      query: (formData) => ({
        url:  "/files/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["File"],
    }),
    deleteFile: builder.mutation({
      query: (id) => ({
        url: `/files/${id}`, method: "DELETE",
      }),
      invalidatesTags: ["File"],
    }),
  }),
});

export const {
  useGetFilesQuery,
  useUploadFileMutation,
  useDeleteFileMutation,
} = fileApi;