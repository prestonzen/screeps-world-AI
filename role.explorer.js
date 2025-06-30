const CreepBase = require('./creep.base');
const STATUSES = require('./creep.status');

const ROLE = 'explorer';
// Explorer body parts: ATTACK, TOUGH, TOUGH, CLAIM, MOVE, MOVE (800 energy total)
const BODY_PARTS = [ATTACK, TOUGH, TOUGH, CLAIM, MOVE, MOVE];
const MIN_AMOUNT = 1;

class RoleExplorer extends CreepBase {
  constructor() {
    super(ROLE, BODY_PARTS, MIN_AMOUNT);
  }

  run(creep) {
    if (!this.hasRole(creep)) return false;

    switch (creep.memory.status) {
      case STATUSES.Explore:
        this.runExploreProcess(creep);
        break;
      case STATUSES.Idle:
        this.runExploreProcess(creep);
        break;
      default:
        console.log(
          this.getCreepName(creep),
          `⛔ status not handled: ${creep.memory.status}`
        );
        // Set a default status if undefined
        this.setStatus(creep, STATUSES.Explore);
    }
  }

  runExploreProcess(creep) {
    // Priority 1: Attack hostile creeps if any in the room
    const hostileCreep = this.findHostileCreep(creep);
    if (hostileCreep) {
      this.attackHostile(creep, hostileCreep);
      return;
    }

    // Priority 2: Handle controller (claim if neutral, attack if hostile)
    if (creep.room.controller) {
      this.handleController(creep);
      return;
    }

    // Priority 3: Move to explorer flag if no immediate threats/objectives
    this.moveToExplorerFlag(creep);
  }

  findHostileCreep(creep) {
    return creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  }

  attackHostile(creep, target) {
    const result = creep.attack(target);
    if (result == ERR_NOT_IN_RANGE) {
      this.moveTo(creep, target, '#ff0000');
      creep.say('⚔️ engage');
    } else if (result == OK) {
      creep.say('⚔️ attack');
    }
    this.setStatus(creep, STATUSES.Explore);
  }

  handleController(creep) {
    const controller = creep.room.controller;
    
    // If controller is not ours (neutral or hostile)
    if (!controller.my) {
      // If it's hostile, attack it
      if (controller.owner) {
        const result = creep.attackController(controller);
        if (result == ERR_NOT_IN_RANGE) {
          this.moveTo(creep, controller, '#ff6600');
          creep.say('🏴 attack ctrl');
        } else if (result == OK) {
          creep.say('💥 destroy');
        }
      } else {
        // If it's neutral, claim it
        const result = creep.claimController(controller);
        if (result == ERR_NOT_IN_RANGE) {
          this.moveTo(creep, controller, '#00ff00');
          creep.say('🏴 claim');
        } else if (result == OK) {
          creep.say('👑 claimed');
        }
      }
    } else {
      // Controller is already ours, look for explorer flag
      this.moveToExplorerFlag(creep);
    }
    
    this.setStatus(creep, STATUSES.Explore);
  }

  moveToExplorerFlag(creep) {
    // Look for explorer flags (white primary, white secondary color)
    // Explorer flags are identified by COLOR_WHITE, COLOR_WHITE
    const explorerFlags = Object.values(Game.flags).filter(flag => 
      flag.color === COLOR_WHITE && flag.secondaryColor === COLOR_WHITE
    );

    if (explorerFlags.length > 0) {
      // Move to the first explorer flag found
      const targetFlag = explorerFlags[0];
      this.moveTo(creep, targetFlag, '#ffffff');
      creep.say('🗺️ explore');
    } else {
      // No explorer flags found, go idle
      creep.say('🤷 no flag');
      this.setStatus(creep, STATUSES.Idle);
    }
  }
}

module.exports = new RoleExplorer();