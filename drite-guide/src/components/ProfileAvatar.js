import React, { useEffect, useState } from 'react';

import {
  DEFAULT_PROFILE_PICTURE_URL,
  getProfilePictureUrl,
} from '../config/assets';
import FastImage from './FastImage';

export default function ProfileAvatar({
  profilePicturePath,
  fallbackUri = DEFAULT_PROFILE_PICTURE_URL,
  style,
}) {
  const resolvedUri = getProfilePictureUrl(profilePicturePath) || fallbackUri;
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [resolvedUri]);

  return (
    <FastImage
      source={{ uri: hasLoadError ? fallbackUri : resolvedUri }}
      style={style}
      resizeMode="cover"
      onError={() => setHasLoadError(true)}
    />
  );
}
