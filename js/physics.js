// 물리 시스템

const Physics = {
  // 물리 상수
  MAX_SPEED: 600,        // 최대 속도 (px/s)
  FRICTION: 0.98,        // 마찰 계수
  RESTITUTION: 0.5,      // 반발 계수
  SLEEP_THRESHOLD: 0.5,  // 정지 판정 임계값
  CELL_SIZE: 150,        // 공간 분할 셀 크기
  SUBSTEPS: 2,           // 물리 서브스텝 (tunneling 방지)

  // 물리 업데이트 (서브스텝 적용)
  update(deltaTime) {
    const subDt = deltaTime / this.SUBSTEPS;

    for (let i = 0; i < this.SUBSTEPS; i++) {
      this.updatePhysics(subDt);
    }
  },

  // 실제 물리 계산
  updatePhysics(deltaTime) {
    const dt = deltaTime / 1000; // ms → s

    // 1. 속도 적용 + 마찰
    Game.state.objects.forEach(obj => {
      if (obj.sleeping) return;

      // 위치 업데이트
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;

      // 마찰력
      obj.vx *= this.FRICTION;
      obj.vy *= this.FRICTION;

      // 속도 제한
      this.applyVelocityLimit(obj);

      // 정지 체크
      if (Math.abs(obj.vx) < this.SLEEP_THRESHOLD &&
          Math.abs(obj.vy) < this.SLEEP_THRESHOLD) {
        obj.vx = 0;
        obj.vy = 0;
        obj.sleeping = true;
      }

      // 벽 충돌
      this.wallCollision(obj);
    });

    // 2. 오브젝트 간 충돌
    this.checkCollisions();
  },

  // 속도 제한 적용
  applyVelocityLimit(obj) {
    const speed = Math.hypot(obj.vx, obj.vy);
    if (speed > this.MAX_SPEED) {
      const scale = this.MAX_SPEED / speed;
      obj.vx *= scale;
      obj.vy *= scale;
    }
  },

  // 벽 충돌
  wallCollision(obj) {
    const minY = 100 + CONFIG.OBJECT_SIZE / 2;
    const maxY = CONFIG.CANVAS_HEIGHT - 200 - CONFIG.OBJECT_SIZE / 2;
    const minX = CONFIG.OBJECT_SIZE / 2;
    const maxX = CONFIG.CANVAS_WIDTH - CONFIG.OBJECT_SIZE / 2;

    // 좌우 벽
    if (obj.x < minX) {
      obj.x = minX;
      obj.vx = -obj.vx * this.RESTITUTION;
    } else if (obj.x > maxX) {
      obj.x = maxX;
      obj.vx = -obj.vx * this.RESTITUTION;
    }

    // 상하 벽
    if (obj.y < minY) {
      obj.y = minY;
      obj.vy = -obj.vy * this.RESTITUTION;
    } else if (obj.y > maxY) {
      obj.y = maxY;
      obj.vy = -obj.vy * this.RESTITUTION;
    }
  },

  // 공간 분할 (Spatial Hashing)
  buildSpatialHash() {
    const grid = {};

    Game.state.objects.forEach(obj => {
      const cellX = Math.floor(obj.x / this.CELL_SIZE);
      const cellY = Math.floor(obj.y / this.CELL_SIZE);
      const key = `${cellX},${cellY}`;

      if (!grid[key]) grid[key] = [];
      grid[key].push(obj);
    });

    return grid;
  },

  // 충돌 체크
  checkCollisions() {
    const grid = this.buildSpatialHash();
    const checked = new Set();

    // 드래그 중인 오브젝트 확인
    const draggedObj = UI.dragState.dragging
      ? Game.state.objects.find(o => o.id === UI.dragState.objectId)
      : null;

    // 드래그 충돌 처리 (일방향)
    if (draggedObj) {
      Game.state.objects.forEach(obj => {
        if (obj.id !== draggedObj.id) {
          this.handleDragCollision(draggedObj, obj);
        }
      });
    }

    // 일반 물리 충돌
    Game.state.objects.forEach(obj => {
      // 드래그 중인 오브젝트는 일반 물리 제외
      if (draggedObj && obj.id === draggedObj.id) return;
      if (obj.sleeping) return;

      const cellX = Math.floor(obj.x / this.CELL_SIZE);
      const cellY = Math.floor(obj.y / this.CELL_SIZE);

      // 주변 9개 셀 체크
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${cellX + dx},${cellY + dy}`;
          const neighbors = grid[key] || [];

          neighbors.forEach(other => {
            // 드래그 중인 오브젝트는 일반 물리 제외
            if (draggedObj && other.id === draggedObj.id) return;
            if (obj.id >= other.id) return; // 중복 체크 방지

            const pairKey = `${obj.id},${other.id}`;
            if (checked.has(pairKey)) return;
            checked.add(pairKey);

            this.handleCollision(obj, other);
          });
        }
      }
    });
  },

  // 충돌 처리
  handleCollision(obj1, obj2) {
    const dx = obj2.x - obj1.x;
    const dy = obj2.y - obj1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = CONFIG.OBJECT_SIZE * 1.02; // 2% 여유

    if (dist < minDist && dist > 0) {
      // 같은 등급 → 머지
      if (obj1.tier === obj2.tier) {
        Game.merge(obj1, obj2);
        return;
      }

      // 다른 등급 → 튕김
      const overlap = minDist - dist;
      const angle = Math.atan2(dy, dx);

      // 밀어내기
      const pushX = Math.cos(angle) * overlap / 2;
      const pushY = Math.sin(angle) * overlap / 2;

      obj1.x -= pushX;
      obj1.y -= pushY;
      obj2.x += pushX;
      obj2.y += pushY;

      // 속도 교환 (탄성 충돌 간단 버전)
      const relativeVx = obj1.vx - obj2.vx;
      const relativeVy = obj1.vy - obj2.vy;

      const dotProduct = (relativeVx * dx + relativeVy * dy) / (dist * dist);

      obj1.vx -= dotProduct * dx * this.RESTITUTION;
      obj1.vy -= dotProduct * dy * this.RESTITUTION;
      obj2.vx += dotProduct * dx * this.RESTITUTION;
      obj2.vy += dotProduct * dy * this.RESTITUTION;

      // 슬립 해제
      obj1.sleeping = false;
      obj2.sleeping = false;
    }
  },

  // 드래그 충돌 처리 (일방향)
  handleDragCollision(draggedObj, other) {
    const dx = other.x - draggedObj.x;
    const dy = other.y - draggedObj.y;
    const dist = Math.hypot(dx, dy);
    const minDist = CONFIG.OBJECT_SIZE * 1.02; // 2% 여유

    if (dist < minDist && dist > 0) {
      // 같은 등급 → 머지
      if (draggedObj.tier === other.tier) {
        Game.merge(draggedObj, other);
        UI.dragState.dragging = false;
        UI.dragState.objectId = null;
        return;
      }

      // 다른 등급 → 밀어내기
      const overlap = minDist - dist;
      const angle = Math.atan2(dy, dx);

      // 상대 오브젝트만 밀어냄
      other.x += Math.cos(angle) * overlap;
      other.y += Math.sin(angle) * overlap;

      // 상대 오브젝트에 속도 부여
      const pushForce = 200;
      other.vx += Math.cos(angle) * pushForce;
      other.vy += Math.sin(angle) * pushForce;

      // 최대 속도 제한
      const speed = Math.hypot(other.vx, other.vy);
      if (speed > this.MAX_SPEED) {
        other.vx = (other.vx / speed) * this.MAX_SPEED;
        other.vy = (other.vy / speed) * this.MAX_SPEED;
      }

      // 슬립 해제
      other.sleeping = false;
    }
  },

  // 드래그 중 충돌 체크 (같은 등급만)
  checkDragCollision(draggedObj) {
    return Game.state.objects.find(obj => {
      if (obj.id === draggedObj.id) return false;
      if (obj.tier !== draggedObj.tier) return false;

      const dist = Math.hypot(obj.x - draggedObj.x, obj.y - draggedObj.y);
      return dist < CONFIG.OBJECT_SIZE * 1.02; // 2% 여유
    });
  }
};
