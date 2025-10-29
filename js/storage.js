// 로컬 스토리지 관리

const Storage = {
  SAVE_KEY: 'mergecount_save',

  // 게임 저장
  save(gameState) {
    try {
      const saveData = {
        gold: gameState.gold,
        objects: gameState.objects.map(obj => ({
          id: obj.id,
          tier: obj.tier,
          x: obj.x,
          y: obj.y,
          lastIncome: obj.lastIncome
        })),
        upgrades: { ...gameState.upgrades },
        lastSaveTime: Date.now()
      };
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error('저장 실패:', e);
      return false;
    }
  },

  // 게임 불러오기
  load() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      if (!data) return null;

      const saveData = JSON.parse(data);

      // 오프라인 수익 계산
      const offlineTime = Date.now() - saveData.lastSaveTime;
      const offlineIncome = this.calculateOfflineIncome(saveData, offlineTime);

      // 위치 경계값 계산
      const minY = 100 + CONFIG.OBJECT_SIZE / 2;
      const maxY = CONFIG.CANVAS_HEIGHT - 200 - CONFIG.OBJECT_SIZE / 2;
      const minX = CONFIG.OBJECT_SIZE / 2;
      const maxX = CONFIG.CANVAS_WIDTH - CONFIG.OBJECT_SIZE / 2;

      return {
        gold: saveData.gold + offlineIncome,
        objects: saveData.objects.map(obj => ({
          ...obj,
          // 위치 유효성 검증
          x: Math.max(minX, Math.min(maxX, obj.x || minX)),
          y: Math.max(minY, Math.min(maxY, obj.y || minY)),
          // 물리 속성 추가
          vx: 0,
          vy: 0,
          sleeping: false,
          lastIncome: Date.now()
        })),
        upgrades: saveData.upgrades,
        offlineIncome: offlineIncome
      };
    } catch (e) {
      console.error('불러오기 실패:', e);
      return null;
    }
  },

  // 오프라인 수익 계산 (간단 버전)
  calculateOfflineIncome(saveData, offlineTime) {
    if (offlineTime <= 0) return 0;

    // 최대 1시간만 계산 (3600000ms)
    const calcTime = Math.min(offlineTime, 3600000);

    const cooldown = Math.max(
      CONFIG.INCOME.BASE_COOLDOWN - (saveData.upgrades.cooldown * CONFIG.UPGRADES.COOLDOWN.REDUCTION_PER_LEVEL),
      CONFIG.INCOME.MIN_COOLDOWN
    );

    const moneyMultiplier = 1 + (saveData.upgrades.money * CONFIG.UPGRADES.MONEY.MULTIPLIER_PER_LEVEL);

    let totalIncome = 0;
    saveData.objects.forEach(obj => {
      const baseIncome = CONFIG.INCOME.BASE_AMOUNT * Math.pow(CONFIG.INCOME.TIER_MULTIPLIER, obj.tier);
      const income = Math.floor(baseIncome * moneyMultiplier);
      const incomeCount = Math.floor(calcTime / cooldown);
      totalIncome += income * incomeCount;
    });

    return totalIncome;
  },

  // 저장 데이터 삭제
  clear() {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
