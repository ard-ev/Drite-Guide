import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const FALLBACK_IMAGE_SOURCE = require('../../assets/logo.png');
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAYS_MS = [350, 1200];

function getSourceKey(source) {
  if (typeof source === 'number') {
    return String(source);
  }

  if (typeof source === 'string') {
    return source;
  }

  if (source?.uri) {
    return source.uri;
  }

  try {
    return JSON.stringify(source || null);
  } catch (_error) {
    return String(source || '');
  }
}

function FastImage({
  fallbackSource = FALLBACK_IMAGE_SOURCE,
  resizeMode = 'cover',
  source,
  style,
  ...props
}) {
  const retryTimerRef = useRef(null);
  const sourceKey = useMemo(() => getSourceKey(source), [source]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    clearTimeout(retryTimerRef.current);
    setFailedAttempts(0);
    setRetryToken(0);

    return () => clearTimeout(retryTimerRef.current);
  }, [sourceKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && failedAttempts > 0) {
        setFailedAttempts(0);
        setRetryToken((current) => current + 1);
      }
    });

    return () => subscription.remove();
  }, [failedAttempts]);

  const shouldUseFallback = failedAttempts > MAX_RETRY_ATTEMPTS;

  return (
    <ExpoImage
      {...props}
      key={`${sourceKey}:${retryToken}:${shouldUseFallback ? 'fallback' : 'source'}`}
      source={shouldUseFallback ? fallbackSource : source}
      style={style}
      contentFit={resizeMode}
      cachePolicy="memory-disk"
      transition={120}
      onError={(event) => {
        setFailedAttempts((currentAttempts) => {
          const nextAttempts = currentAttempts + 1;

          if (nextAttempts <= MAX_RETRY_ATTEMPTS) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = setTimeout(() => {
              setRetryToken((current) => current + 1);
            }, RETRY_DELAYS_MS[nextAttempts - 1] || RETRY_DELAYS_MS[0]);
          }

          return nextAttempts;
        });
        props.onError?.(event);
      }}
    />
  );
}

export default React.memo(FastImage);
