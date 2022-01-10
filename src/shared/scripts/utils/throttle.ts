let time: number = Date.now();

/**
 * throttle
 * @param {Function} func - 実行したい関数
 * @param {number} duration - 間引きしたい時間
 * @returns {Function}
 */
const throttle: (func: () => void, duration: number) => void = (
  func: () => void,
  duration = 1000
) => {
  duration = duration / 60;

  const onResult: () => void = () => {
    if (time + duration - Date.now() < 0) {
      time = new Date().getTime();
      func();
    }
  };

  return onResult();
};

export default throttle;
