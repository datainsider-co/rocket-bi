import { useCallback, useEffect, useState } from 'react';
import { RESEND_AFTER_SECONDS, secondsUntilResend } from './forgotPassword.utils';

/** Seconds left before a code may be resent. `restart()` marks a code as just sent. */
export function useResendCountdown(waitSeconds = RESEND_AFTER_SECONDS, now: () => number = Date.now) {
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const secondsLeft = sentAt === null ? 0 : secondsUntilResend(sentAt, currentTime, waitSeconds);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setInterval(() => setCurrentTime(now()), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, now]);

  const restart = useCallback(() => {
    const time = now();
    setSentAt(time);
    setCurrentTime(time);
  }, [now]);

  return { secondsLeft, restart };
}
