// 게임 설정 및 밸런싱 상수

const CONFIG = {
  // 캔버스 설정 (고정 비율: 1080x1920)
  CANVAS_WIDTH: 1080,
  CANVAS_HEIGHT: 1920,
  GAME_AREA_HEIGHT: 1620, // 게임 영역 높이 (상단바 100px + 하단바 200px 제외)

  // 오브젝트 설정
  OBJECT_SIZE: 150, // 오브젝트 크기

  // 등급별 정보 (sides: 도형의 변 개수)
  TIERS: [
    { name: '원', sides: 0, color: '#FF6B6B' },      // 1등급
    { name: '삼각형', sides: 3, color: '#FFA500' },  // 2등급
    { name: '사각형', sides: 4, color: '#FFD93D' },  // 3등급
    { name: '오각형', sides: 5, color: '#6BCB77' },  // 4등급
    { name: '육각형', sides: 6, color: '#4D96FF' },  // 5등급
    { name: '칠각형', sides: 7, color: '#9B59B6' },  // 6등급
    { name: '팔각형', sides: 8, color: '#E74C3C' },  // 7등급
    { name: '구각형', sides: 9, color: '#1ABC9C' },  // 8등급
    { name: '십각형', sides: 10, color: '#F39C12' }, // 9등급
    { name: '십일각형', sides: 11, color: '#E91E63' } // 10등급
  ],

  // 수익 시스템
  INCOME: {
    BASE_AMOUNT: 1,        // 기본 수익 (1등급)
    TIER_MULTIPLIER: 2,    // 등급당 수익 배율 (2^tier)
    BASE_COOLDOWN: 2000,   // 기본 쿨타임 (ms)
    MIN_COOLDOWN: 100      // 최소 쿨타임 (ms)
  },

  // 업그레이드 시스템
  UPGRADES: {
    COOLDOWN: {
      BASE_COST: 100,
      COST_MULTIPLIER: 1.5,
      REDUCTION_PER_LEVEL: 100 // ms 감소
    },
    MONEY: {
      BASE_COST: 150,
      COST_MULTIPLIER: 1.6,
      MULTIPLIER_PER_LEVEL: 0.1 // 10% 증가
    },
    GACHA: {
      BASE_COST: 500,
      COST_MULTIPLIER: 2.0
    }
  },

  // 뽑기 시스템
  GACHA: {
    BASE_COST: 50,
    // 뽑기 레벨별 확률 테이블 (tier: 등급, prob: 확률)
    PROBABILITY_TABLE: [
      // Level 1
      [{ tier: 0, prob: 1.0 }],
      // Level 2
      [{ tier: 0, prob: 0.8 }, { tier: 1, prob: 0.2 }],
      // Level 3
      [{ tier: 0, prob: 0.6 }, { tier: 1, prob: 0.3 }, { tier: 2, prob: 0.1 }],
      // Level 4
      [{ tier: 0, prob: 0.4 }, { tier: 1, prob: 0.35 }, { tier: 2, prob: 0.2 }, { tier: 3, prob: 0.05 }],
      // Level 5
      [{ tier: 0, prob: 0.3 }, { tier: 1, prob: 0.3 }, { tier: 2, prob: 0.25 }, { tier: 3, prob: 0.1 }, { tier: 4, prob: 0.05 }]
    ]
  },

  // 초기 게임 상태
  INITIAL_STATE: {
    gold: 100,
    objects: [],
    upgrades: {
      cooldown: 0,
      money: 0,
      gacha: 0
    }
  }
};

// 설정 관리 시스템
const Settings = {
  STORAGE_KEY: 'mergecount_settings',

  // 조절 가능한 설정값 (기본값)
  values: {
    baseIncome: 1,           // 기본 수익
    tierMultiplier: 2,       // 등급당 수익 배율
    baseCooldown: 2000,      // 기본 쿨타임 (ms)
    gachaCost: 50,           // 뽑기 비용
    objectSize: 150,         // 오브젝트 크기
    upgradeCostMultiplier: 1.5, // 업그레이드 비용 배율
    textScale: 1.0           // 텍스트 크기 배율 (0.5 ~ 2.0)
  },

  // 설정 로드
  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.values = { ...this.values, ...data };
        this.apply();
      }
    } catch (e) {
      console.error('설정 로드 실패:', e);
    }
  },

  // 설정 저장
  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.values));
    } catch (e) {
      console.error('설정 저장 실패:', e);
    }
  },

  // 설정 적용
  apply() {
    CONFIG.INCOME.BASE_AMOUNT = this.values.baseIncome;
    CONFIG.INCOME.TIER_MULTIPLIER = this.values.tierMultiplier;
    CONFIG.INCOME.BASE_COOLDOWN = this.values.baseCooldown;
    CONFIG.GACHA.BASE_COST = this.values.gachaCost;
    CONFIG.OBJECT_SIZE = this.values.objectSize;
    CONFIG.UPGRADES.COOLDOWN.COST_MULTIPLIER = this.values.upgradeCostMultiplier;
    CONFIG.UPGRADES.MONEY.COST_MULTIPLIER = this.values.upgradeCostMultiplier;

    // CSS 변수 업데이트 (텍스트 스케일)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--text-scale', this.values.textScale);
    }
  },

  // 설정 값 변경
  set(key, value) {
    if (this.values.hasOwnProperty(key)) {
      this.values[key] = value;
      this.apply();
      this.save();
    }
  },

  // 설정 초기화
  reset() {
    this.values = {
      baseIncome: 1,
      tierMultiplier: 2,
      baseCooldown: 2000,
      gachaCost: 50,
      objectSize: 150,
      upgradeCostMultiplier: 1.5,
      textScale: 1.0
    };
    this.apply();
    this.save();
  }
};
