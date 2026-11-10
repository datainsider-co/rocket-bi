import { useMemo } from 'react';
import { App } from 'antd';
import './toast.css';

export interface Toast {
  success: (text: string) => void;
  error: (text: string) => void;
}

/** v1 `PopupUtils.showSuccess` / `showError`: a card at the bottom right, titled by its kind. */
export function useToast(): Toast {
  const { notification } = App.useApp();
  return useMemo(
    () => ({
      success: text => notification.success({ title: 'Success', description: text, placement: 'bottomRight', className: 'di-toast di-toast--success' }),
      error: text => notification.error({ title: 'Error', description: text, placement: 'bottomRight', className: 'di-toast di-toast--error' })
    }),
    [notification]
  );
}
