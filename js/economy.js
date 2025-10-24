// 경제 시스템 (수익, 뽑기, 업그레이드)

const Economy = {
  // 자동 수익 업데이트
  updateIncome() {
    const now = Date.now();
    const cooldown = this.getCooldown();
    const moneyMultiplier = this.getMoneyMultiplier();

    let totalIncome = 0;

    Game.state.objects.forEach(obj => {
      // 쿨타임 체크
      if (now - obj.lastIncome >= cooldown) {
        const income = this.calculateIncome(obj.tier, moneyMultiplier);
        totalIncome += income;
        obj.lastIncome = now;
      }
    });

    if (totalIncome > 0) {
      Game.addGold(totalIncome);
    }
  },

  // 오브젝트별 수익 계산
  calculateIncome(tier, moneyMultiplier) {
    const baseIncome = CONFIG.INCOME.BASE_AMOUNT * Math.pow(CONFIG.INCOME.TIER_MULTIPLIER, tier);
    return Math.floor(baseIncome * moneyMultiplier);
  },

  // 현재 쿨타임 계산
  getCooldown() {
    const reduction = Game.state.upgrades.cooldown * CONFIG.UPGRADES.COOLDOWN.REDUCTION_PER_LEVEL;
    return Math.max(
      CONFIG.INCOME.BASE_COOLDOWN - reduction,
      CONFIG.INCOME.MIN_COOLDOWN
    );
  },

  // 현재 돈 배율 계산
  getMoneyMultiplier() {
    return 1 + (Game.state.upgrades.money * CONFIG.UPGRADES.MONEY.MULTIPLIER_PER_LEVEL);
  },

  // 뽑기 실행
  doGacha() {
    const cost = CONFIG.GACHA.BASE_COST;

    if (!Game.spendGold(cost)) {
      return { success: false, message: '골드가 부족합니다' };
    }

    const tier = this.rollGacha();
    const obj = Game.addObject(tier);

    return {
      success: true,
      tier: tier,
      object: obj,
      message: `${CONFIG.TIERS[tier].name} 획득!`
    };
  },

  // 뽑기 등급 결정
  rollGacha() {
    const level = Game.state.upgrades.gacha;
    const tableIndex = Math.min(level, CONFIG.GACHA.PROBABILITY_TABLE.length - 1);
    const probTable = CONFIG.GACHA.PROBABILITY_TABLE[tableIndex];

    const rand = Math.random();
    let cumulative = 0;

    for (const entry of probTable) {
      cumulative += entry.prob;
      if (rand < cumulative) {
        return entry.tier;
      }
    }

    return 0; // fallback
  },

  // 업그레이드 비용 계산
  getUpgradeCost(type) {
    const level = Game.state.upgrades[type];
    const config = CONFIG.UPGRADES[type.toUpperCase()];
    return Math.floor(config.BASE_COST * Math.pow(config.COST_MULTIPLIER, level));
  },

  // 업그레이드 실행
  upgrade(type) {
    const cost = this.getUpgradeCost(type);

    if (!Game.spendGold(cost)) {
      return { success: false, message: '골드가 부족합니다' };
    }

    Game.state.upgrades[type]++;

    let message = '';
    switch (type) {
      case 'cooldown':
        message = `쿨타임 감소 Lv.${Game.state.upgrades[type]}`;
        break;
      case 'money':
        message = `수익 증가 Lv.${Game.state.upgrades[type]} (+${Game.state.upgrades[type] * 10}%)`;
        break;
      case 'gacha':
        message = `뽑기 레벨 Lv.${Game.state.upgrades[type]}`;
        break;
    }

    return { success: true, message: message };
  },

  // 업그레이드 정보 가져오기
  getUpgradeInfo(type) {
    const level = Game.state.upgrades[type];
    const cost = this.getUpgradeCost(type);
    let effect = '';

    switch (type) {
      case 'cooldown':
        const currentCooldown = this.getCooldown() / 1000;
        const nextCooldown = Math.max(
          (CONFIG.INCOME.BASE_COOLDOWN - (level + 1) * CONFIG.UPGRADES.COOLDOWN.REDUCTION_PER_LEVEL) / 1000,
          CONFIG.INCOME.MIN_COOLDOWN / 1000
        );
        effect = `${currentCooldown.toFixed(1)}s → ${nextCooldown.toFixed(1)}s`;
        break;
      case 'money':
        const currentMultiplier = (this.getMoneyMultiplier() * 100).toFixed(0);
        const nextMultiplier = ((1 + (level + 1) * CONFIG.UPGRADES.MONEY.MULTIPLIER_PER_LEVEL) * 100).toFixed(0);
        effect = `${currentMultiplier}% → ${nextMultiplier}%`;
        break;
      case 'gacha':
        effect = `레벨 ${level} → ${level + 1}`;
        break;
    }

    return { level, cost, effect };
  }
};
