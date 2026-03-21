import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  files:          [],
  uploadProgress: 0,
  loading:        false,
};

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    setFiles:          (state, action) => { state.files = action.payload; },
    addFile:           (state, action) => { state.files.unshift(action.payload); },
    removeFile:        (state, action) => {
      state.files = state.files.filter((f) => f.id !== action.payload);
    },
    setUploadProgress: (state, action) => { state.uploadProgress = action.payload; },
    setLoading:        (state, action) => { state.loading = action.payload; },
  },
});

export const {
  setFiles, addFile, removeFile,
  setUploadProgress, setLoading,
} = fileSlice.actions;

export default fileSlice.reducer;