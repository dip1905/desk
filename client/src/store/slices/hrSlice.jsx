import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  employees:  [],
  leaves:     [],
  attendance: [],
  loading:    false,
};

const hrSlice = createSlice({
  name: "hr",
  initialState,
  reducers: {
    setEmployees:      (state, action) => { state.employees = action.payload; },
    addEmployee:       (state, action) => { state.employees.push(action.payload); },
    updateEmployee:    (state, action) => {
      const index = state.employees.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) state.employees[index] = action.payload;
    },
    setLeaves:         (state, action) => { state.leaves = action.payload; },
    updateLeaveStatus: (state, action) => {
      const { id, status, reviewNote } = action.payload;
      const index = state.leaves.findIndex((l) => l.id === id);
      if (index !== -1) {
        state.leaves[index].status     = status;
        state.leaves[index].reviewNote = reviewNote;
      }
    },
    setAttendance:     (state, action) => { state.attendance = action.payload; },
    setLoading:        (state, action) => { state.loading = action.payload; },
  },
});

export const {
  setEmployees, addEmployee, updateEmployee,
  setLeaves, updateLeaveStatus,
  setAttendance, setLoading,
} = hrSlice.actions;

export default hrSlice.reducer;