import React from 'react';
import { Image as ExpoImage } from 'expo-image';

function FastImage({
  resizeMode = 'cover',
  source,
  style,
  ...props
}) {
  return (
    <ExpoImage
      {...props}
      source={source}
      style={style}
      contentFit={resizeMode}
      cachePolicy="disk"
      transition={120}
    />
  );
}

export default React.memo(FastImage);
