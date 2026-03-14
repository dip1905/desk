import { createSlice } from "@reduxjs/toolkit";

// What: Manages logged in user state globally
// Why: Every component that needs to know who is logged in
//      reads from here — navbar, route guards, profile page

const initialState = {
  user:            null,
  token:           localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {

    // Called after successful login or register
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user            = user;
      state.token           = token;
      state.isAuthenticated = true;
      localStorage.setItem("token", token);
    },

    // Update profile without full re-login
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    // Called on logout — clears everything
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    },
  },
});

export const { setCredentials, updateProfile, logout } = authSlice.actions;

// Selectors — components use these to read state
// Why selectors? If state shape changes we only
// update the selector not every component
export const selectUser            = (state) => state.auth.user;
export const selectToken           = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;