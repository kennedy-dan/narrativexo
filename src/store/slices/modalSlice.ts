import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ModalType = 'login' | 'signup' | 'none';

interface ModalState {
  isOpen: boolean;
  modalType: ModalType;
  message: string;
}

const initialState: ModalState = {
  isOpen: false,
  modalType: 'none',
  message: 'Log in or sign up to get smarter responses.',
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<{ type?: ModalType; message?: string }>) => {
      state.isOpen = true;
      state.modalType = action.payload.type || 'login';
      state.message = action.payload.message || initialState.message;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.modalType = 'none';
    },
    setModalType: (state, action: PayloadAction<ModalType>) => {
      state.modalType = action.payload;
    },
  },
});

export const { openModal, closeModal, setModalType } = modalSlice.actions;
export default modalSlice.reducer;