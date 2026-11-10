import { App } from 'antd';
import { LoginMethodView } from './LoginMethodView';
import { useLoginMethod } from './useLoginMethod';

/** Opened from User Managements' Login Method button, for users with `login_method:manage`. */
export function LoginMethodModal({ onClose }: { onClose: () => void }) {
  const { message } = App.useApp();
  const { initialValues, loadError, save } = useLoginMethod(() => {
    void message.success('Login methods saved');
    onClose();
  });

  return <LoginMethodView initialValues={initialValues} loadError={loadError} save={save} onCancel={onClose} />;
}
