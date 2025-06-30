const STATUSES = require('./creep.status');

class CreepBase {
  constructor(role, bodyParts, minAmount) {
    this.roleName = role;
    this.bodyParts = bodyParts;
    this.minAmount = minAmount;
  }

  hasRole(creep) {
    return creep.memory.role && this.roleName === creep.memory.role;
  }

  getCreepName(creep) {
    return `creep[name=${creep.name}, role=${this.roleName}]`;
  }

  setStatus(creep, status) {
    creep.memory.status = status;
  }

  calculateCost(bodyParts) {
    return _.sum(bodyParts, (piece) => BODYPART_COST[piece]);
  }

  canSpawn(spawner) {
    const creepCount = _.filter(
      Game.creeps,
      (creep) => spawner.room.name === creep.room.name && this.hasRole(creep)
    ).length;
    const hasEnoughEnergy =
      this.calculateCost(this.bodyParts) <= spawner.room.energyAvailable;

    return creepCount < this.minAmount && hasEnoughEnergy;
  }

  spawn(spawner) {
    const creepName = `${this.roleName}_${Game.time}`;
    const code = spawner.spawnCreep(this.bodyParts, creepName, {
      memory: { role: this.roleName, status: STATUSES.Idle },
    });

    switch (code) {
      case OK:
        console.log(`🛠️ ${creepName} spawned`);
        break;
      case ERR_BUSY:
        // Ignore this case
        console.log(spawner.name, '🛠️ spawner busy');
        break;
      case ERR_NOT_ENOUGH_ENERGY:
        console.log(spawner.name, `🔋 not enough energy to spawn ${creepName}`);
        break;
      default:
        console.log(creepName, `⛔ code not handled: ${code}`);
    }
  }

  suicide(creep) {
    creep.say('💀 ');
    this.setStatus(creep, 'Suicide');
    creep.suicide();

    // Drop every resource and delete creep from memory
    for (const resourceType in creep.carry) {
      creep.drop(resourceType);
    }
    delete Memory.creeps[creep.name];

    console.log(
      this.getCreepName(creep),
      `💀 commited suicide at ${creep.pos}`
    );
  }

  moveTo(creep, target, color) {
    const opts = {};

    if (color) {
      opts.visualizePathStyle = {
        stroke: color,
        opacity: 1,
        lineStyle: 'dotted',
      };
    }
    creep.say(`🚙 `);
    creep.memory.currentTarget = target;

    return creep.moveTo(target, opts);
  }

  getCurrentTarget(creep) {
    return Game.getObjectById(creep.memory.currentTarget);
  }

  removeCurrentTarget(creep) {
    delete creep.memory.currentTarget;
  }

  findDroppedResources(creep) {
    return creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (source) =>
        source.resourceType === RESOURCE_ENERGY && source.projectedEnergy > 25,
    });
  }

  harvest(creep) {
    let source =
      this.getCurrentTarget(creep) ||
      this.findDroppedResources(creep) ||
      creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (!source) return;

    const code = creep.harvest(source);
    switch (code) {
      case ERR_NOT_IN_RANGE:
        this.moveTo(creep, source, '#ffaa00');
        break;
      case OK:
        creep.say('⛏️');
        this.setStatus(creep, STATUSES.Harvest);
        this.removeCurrentTarget(creep);
        break;
      default:
        console.log(this.getCreepName(creep), `⛔ code not handled: ${code}`);
    }
  }
}

module.exports = CreepBase;
