// 메인 게임 루프 및 초기화

const Main = {
  lastTime: 0,
  running: false,

  // 게임 시작
  init() {
    // 게임 초기화
    Game.init();

    // UI 초기화
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    UI.init(canvas);

    // 게임 시작
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);

    console.log('게임 시작!');
  },

  // 메인 게임 루프
  gameLoop(currentTime) {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 업데이트
    this.update(deltaTime);

    // 렌더링
    UI.render();

    // 다음 프레임
    requestAnimationFrame(this.gameLoop.bind(this));
  },

  // 업데이트
  update(deltaTime) {
    // 자동 수익
    Economy.updateIncome();

    // 게임 상태 업데이트
    Game.update(deltaTime);
  },

  // 게임 정지
  stop() {
    this.running = false;
    Game.save();
  }
};

// 페이지 로드 시 게임 시작
window.addEventListener('load', () => {
  Main.init();
});

// 페이지 종료 시 저장
window.addEventListener('beforeunload', () => {
  Game.save();
});
