import gsap from 'gsap';

/**
 * スムーススクロールでy座標まで
 * @param {number} y 移動する高さ
 */
const smoothscroll: (y: number) => void = (y = 0) => {
  const HTML = document.getElementsByTagName('html')[0];
  const BODY = document.getElementsByTagName('body')[0];

  gsap.to([HTML, BODY], {
    duration: 0.6,
    scrollTop: y,
    ease: 'expo.in0ut'
  });
};

export default smoothscroll;
