const roleHarvester = require('./role.harvester');
const roleUpgrader = require('./role.upgrader');
const roleBuilder = require('./role.builder');

class Spawner {
  constructor() {
    this.minimumCreepCost = 300;
    this.structureType = STRUCTURE_SPAWN;
    this.structureFilter = { structureType: this.structureType };
  }

  run(spawner) {
    // Spawner is already spawning
    if (spawner.spawning != null) {
      return;
    }
    
    // Spawner can not create a basic creep
    if (spawner.store[RESOURCE_ENERGY] < this.minimumCreepCost) {
      return;
    }

    // Set a hierarchy of roles with builder priority
    if (roleHarvester.canSpawn(spawner)) {
      roleHarvester.spawn(spawner);
    } else if (this.shouldSpawnBuilder(spawner)) {
      roleBuilder.spawn(spawner);
    } else if (roleUpgrader.canSpawn(spawner)) {
      roleUpgrader.spawn(spawner);
    }
  }

  shouldSpawnBuilder(spawner) {
    // Check if we can spawn builders
    if (!roleBuilder.canSpawn(spawner)) {
      return false;
    }

    // Check for construction sites
    const constructionSites = spawner.room.find(FIND_CONSTRUCTION_SITES);
    return constructionSites.length > 0;
  }

  getStructures(room) {
    return room.find(FIND_MY_STRUCTURES, {
      filter: this.structureFilter,
    });
  }

  getConstructionSites(room) {
    return room.find(FIND_CONSTRUCTION_SITES, {
      filter: this.structureFilter,
    });
  }
}

module.exports = new Spawner();