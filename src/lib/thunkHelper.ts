// utils/thunkHelper.ts
export const handleThunkResult = async (dispatch: any, thunkAction: any) => {
  const result = await dispatch(thunkAction);
  
  // Check if it's an error action (Redux Toolkit adds this)
  if (result?.error) {
    throw new Error(result.error.message || 'Action failed');
  }
  
  return result;
};