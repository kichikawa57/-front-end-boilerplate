type TUa = 'sp' | 'tab' | 'other';

export const getDevice: () => TUa = (): TUa => {
  let result: TUa = 'other';
  const ua = navigator.userAgent;

  if (
    ua.indexOf('iPhone') > 0 ||
    ua.indexOf('iPod') > 0 ||
    (ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0)
  ) {
    result = 'sp';
  } else if (ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) {
    result = 'tab';
  }

  return result;
};
