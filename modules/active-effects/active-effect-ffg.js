import {
  activeEffectChangesUpdate,
  activeEffectCreateData,
} from "../compatibility/active-effects.js";
import ModifierHelpers from "../helpers/modifiers.js";

/**
 * Item types that only grant what they carry while they are equipped. Ship weapons and ship
 * attachments have an equipped state as well, but no way to set it, so they are left out.
 */
const equipGatedTypes = ["armour", "weapon"];

function disablePushOnItem(options){
  // don't show push/animation if that's an effect from item
  if(options.parent?.parentCollection === "items")
  {
    options.animate = false;
  }
}

/**
 * Extend the basic ActiveEffect
 * @extends {ActiveEffect}
 */
export class ActiveEffectFFG extends foundry.documents.ActiveEffect {
  /**
   * Normalize all system-created effects before Foundry constructs documents.
   * @override
   */
  static async createDocuments(data = [], context = {}) {
    return super.createDocuments(data.map(effect => activeEffectCreateData(effect)), context);
  }

  /** @override */
  async update(data = {}, operation = {}) {
    if (Array.isArray(data.changes) || Array.isArray(data.system?.changes)) {
      const changes = data.system?.changes ?? data.changes;
      const normalized = activeEffectChangesUpdate(changes);
      data = {...data};
      delete data.changes;
      if (data.system?.changes) {
        data.system = {...data.system};
        delete data.system.changes;
        if (!Object.keys(data.system).length) delete data.system;
      }
      Object.assign(data, normalized);
    }
    return super.update(data, operation);
  }

  /** @override */
  async _onCreate(changed, options, userId) {
    disablePushOnItem(options);
    await super._onCreate(changed, options, userId);
  }

  /** @override */
  async _onUpdate(changed, options, userId) {
    disablePushOnItem(options);
    await super._onUpdate(changed, options, userId);
  }

  /** @override */
  async _onDelete(options, userId) {
    disablePushOnItem(options);
    await super._onDelete(options, userId);
  }

  /**
   * Weapons and armor only grant what they carry while they are equipped. Encumbrance is the
   * exception - carrying something is what makes it encumbering in the first place
   * @override
   */
  apply(doc, change, ...args) {
    const item = this.parent;
    if (
      equipGatedTypes.includes(item?.type) &&
      !item.system?.equippable?.equipped &&
      change.key !== ModifierHelpers.getModKeyPath("Stat", "Encumbrance")
    ) {
      return {};
    }
    return super.apply(doc, change, ...args);
  }
}
