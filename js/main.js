// 메인 게임 루프 및 초기화

const Main = {
  lastTime: 0,
  running: false,
  backgroundStartTime: null,

  // 게임 시작
  init() {
    // 설정 로드 (게임보다 먼저!)
    Settings.load();

    // 게임 초기화
    Game.init();

    // UI 초기화
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    UI.init(canvas);

    // Page Visibility API 리스너
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 백그라운드 진입
        this.backgroundStartTime = Date.now();
        console.log('백그라운드 진입');
      } else {
        // 포그라운드 복귀
        if (this.backgroundStartTime) {
          const elapsed = Date.now() - this.backgroundStartTime;
          const income = Economy.calculateBackgroundIncome(elapsed);

          if (income > 0) {
            Game.addGold(income);
            console.log(`백그라운드 수익: ${income} 골드 (${(elapsed/1000).toFixed(1)}초)`);
          }

          this.backgroundStartTime = null;
        }
      }
    });

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

    // 물리 업데이트
    Physics.update(deltaTime);

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
