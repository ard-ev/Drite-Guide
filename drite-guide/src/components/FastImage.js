import React, { useEffect, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';

const FALLBACK_IMAGE_SOURCE = require('../../assets/logo.png');

function FastImage({
  fallbackSource = FALLBACK_IMAGE_SOURCE,
  resizeMode = 'cover',
  source,
  style,
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [source]);

  return (
    <ExpoImage
      {...props}
      source={hasError ? fallbackSource : source}
      style={style}
      contentFit={resizeMode}
      cachePolicy="memory-disk"
      transition={120}
      onError={(event) => {
        setHasError(true);
        props.onError?.(event);
      }}
    />
  );
}

export default React.memo(FastImage);
