import { configureStore } from '@reduxjs/toolkit';
// Import your reducers here. For now, we'll use a placeholder rootReducer.
// Replace this with your actual reducers if you have them.

const initialAuthState = {
  user: null,
  user_id: null,
};

function authReducer(state = initialAuthState, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, user_id: action.payload?.id };
    case 'LOGOUT':
      return initialAuthState;
    default:
      return state;
  }
}

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here
  },
});

export default store;
