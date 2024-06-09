import { useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import { startTracking, logout } from '../../actions/auth';
import useThrottle from '../../hooks/useThrottle';
import setAuthToken from '../../utils/setAuthToken';
import { storageEvents } from './EventHandler.data';
import {
  setupTimers,
  removeTracking,
  addOfflineListener,
  removeOfflineListener,
  startTimer
} from './EventHandler.services';

const EventHandler = ({
  auth: { isAuthenticated, tracking },
  startTracking,
  logout
}) => {
  const timeoutId = useRef(null);
  const resetTimer = useThrottle(
    useCallback(() => {
      window.clearTimeout(document?.timeoutId?.current);
      startTimer({
        logout,
        timeoutId: document.timeoutId
      });
    }, [logout]),
    1000
  );

  const checkStorageEvent = useCallback(
    (e) => {
      if (e.key === storageEvents.UPDATE_TIME_TRACKER) {
        if (!e.newValue && isAuthenticated) {
          setAuthToken();
          logout();
        }
      }

      if (e.key === storageEvents.EMAIL_CONFIRMED) {
        if (!e.oldValue && e.newValue && isAuthenticated) {
          window.location.reload();
        }
      }
    },
    [isAuthenticated, logout]
  );

  //Track User Activity
  useEffect(() => {
    if (isAuthenticated && !tracking) {
      startTracking();
      setupTimers({ logout, timeoutId, resetTimer });
      addOfflineListener();
    }

    if (!isAuthenticated && !tracking && timeoutId.current) {
      removeTracking({ timeoutId, resetTimer });
      removeOfflineListener();
    }
  }, [isAuthenticated, tracking, startTracking, logout, resetTimer]);

  //Track LocalStorage
  useEffect(() => {
    window.addEventListener('storage', checkStorageEvent);
    return () => {
      window.removeEventListener('storage', checkStorageEvent);
    };
  }, [checkStorageEvent]);

  return null;
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, {
  startTracking,
  logout
})(EventHandler);
