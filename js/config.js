// 게임 설정 및 밸런싱 상수

const CONFIG = {
  // 캔버스 설정
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // 오브젝트 설정
  OBJECT_SIZE: 50, // 오브젝트 크기

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
