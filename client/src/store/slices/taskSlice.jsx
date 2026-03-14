import { createSlice } from "@reduxjs/toolkit";

// What: Manages kanban board state
// Why: Drag and drop needs instant UI updates
//      We update Redux immediately (optimistic update)
//      then sync with API in background

const initialState = {
  tasks:   [],
  filters: {
    status:   null,
    priority: null,
    assignee: null,
  },
  loading: false,
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {

    setTasks: (state, action) => {
      state.tasks = action.payload;
    },

    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },

    updateTask: (state, action) => {
      const index = state.tasks
        .findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },

    // Used for drag and drop — instant UI update
    moveTask: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const index = state.tasks
        .findIndex((t) => t.id === taskId);
      if (index !== -1) {
        state.tasks[index].status = newStatus;
      }
    },

    deleteTask: (state, action) => {
      state.tasks = state.tasks
        .filter((t) => t.id !== action.payload);
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = { status: null, priority: null, assignee: null };
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  moveTask,
  deleteTask,
  setFilters,
  clearFilters,
  setLoading,
} = taskSlice.actions;

export const selectTasks   = (state) => state.tasks.tasks;
export const selectFilters = (state) => state.tasks.filters;

export default taskSlice.reducer;