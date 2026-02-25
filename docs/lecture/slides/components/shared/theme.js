export const CONFIG = {
  idleTimeoutMs: 3000,
  keys: {
    next: ['ArrowRight', 'ArrowDown', ' '],
    prev: ['ArrowLeft', 'ArrowUp'],
    fullscreen: 'f'
  }
};

export const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('presentation-styles')) return;
  const style = document.createElement('style');
  style.id = 'presentation-styles';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');

    * {
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    body {
      margin: 0;
      background-color: #f8fafc;
      color: #0f172a;
      overflow: hidden;
    }

    ::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);
};
