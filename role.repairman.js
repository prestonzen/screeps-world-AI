const CreepBase = require('./creep.base');
const STATUSES = require('./creep.status');

const ROLE = 'repairman';
const BODY_PARTS = [WORK, WORK, CARRY, MOVE];
const MIN_AMOUNT = 2;

class RoleRepairman extends CreepBase {
  constructor() {
    super(ROLE, BODY_PARTS, MIN_AMOUNT);
  }

  run(creep) {
    if (!this.hasRole(creep)) return false;

    // console.log(`${this.getCreepName(creep)} status: ${creep.memory.status}, energy: ${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`);

    switch (creep.memory.status) {
      case STATUSES.Repair:
        this.runRepairProcess(creep);
        break;
      case STATUSES.Idle:
      case STATUSES.Harvest:
        this.runHarvestProcess(creep);
        break;
      default:
        console.log(
          this.getCreepName(creep),
          `⛔ status not handled: ${creep.memory.status}`
        );
        // Set a default status if undefined
        this.setStatus(creep, STATUSES.Harvest);
    }
  }

  runRepairProcess(creep) {
    // console.log(`${this.getCreepName(creep)} running repair process`);
    if (creep.store[RESOURCE_ENERGY] > 0) {
      this.repair(creep);
    } else {
      // console.log(`${this.getCreepName(creep)} no energy, switching to harvest`);
      this.setStatus(creep, STATUSES.Harvest);
    }
  }

  runHarvestProcess(creep) {
    // console.log(`${this.getCreepName(creep)} running harvest process`);
    if (creep.store.getFreeCapacity() > 0) {
      this.harvest(creep);
    } else {
      // console.log(`${this.getCreepName(creep)} full energy, switching to repair`);
      this.setStatus(creep, STATUSES.Repair);
      this.repair(creep);
    }
  }

  repair(creep) {
    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: object => {
        // Only repair structures that are damaged
        return object.hits < object.hitsMax;
      }
    });

    // Sort by lowest current health first (most critical)
    targets.sort(function(a, b) {
      return a.hits - b.hits;
    });

    if (targets.length > 0) {
      const result = creep.repair(targets[0]);
      if (result == ERR_NOT_IN_RANGE) {
        this.moveTo(creep, targets[0], '#ffff00');
      } else if (result == OK) {
        creep.say('🔧 ');
      }
      this.setStatus(creep, STATUSES.Repair);
    } else {
      // No repair targets, go idle
      this.setStatus(creep, STATUSES.Idle);
    }
  }
}

module.exports = new RoleRepairman();