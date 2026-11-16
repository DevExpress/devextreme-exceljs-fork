const BaseXform = require('../../base-xform');
const CompositeXform = require('../../composite-xform');

const DatabarExtXform = require('./databar-ext-xform');
const IconSetExtXform = require('./icon-set-ext-xform');

const randomUUID = () => {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }

  // randomUUID() exists only on secure (HTTPS) pages; getRandomValues() exists everywhere
  const bytes = webCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, b => (b + 0x100).toString(16).slice(1)).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const extIcons = {
  '3Triangles': true,
  '3Stars': true,
  '5Boxes': true,
};

class CfRuleExtXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      'x14:dataBar': (this.databarXform = new DatabarExtXform()),
      'x14:iconSet': (this.iconSetXform = new IconSetExtXform()),
    };
  }

  get tag() {
    return 'x14:cfRule';
  }

  static isExt(rule) {
    // is this rule primitive?
    if (rule.type === 'dataBar') {
      return DatabarExtXform.isExt(rule);
    }
    if (rule.type === 'iconSet') {
      if (rule.custom || extIcons[rule.iconSet]) {
        return true;
      }
    }
    return false;
  }

  prepare(model) {
    if (CfRuleExtXform.isExt(model)) {
      model.x14Id = `{${randomUUID()}}`.toUpperCase();
    }
  }

  render(xmlStream, model) {
    if (!CfRuleExtXform.isExt(model)) {
      return;
    }

    switch (model.type) {
      case 'dataBar':
        this.renderDataBar(xmlStream, model);
        break;
      case 'iconSet':
        this.renderIconSet(xmlStream, model);
        break;
    }
  }

  renderDataBar(xmlStream, model) {
    xmlStream.openNode(this.tag, {
      type: 'dataBar',
      id: model.x14Id,
    });

    this.databarXform.render(xmlStream, model);

    xmlStream.closeNode();
  }

  renderIconSet(xmlStream, model) {
    xmlStream.openNode(this.tag, {
      type: 'iconSet',
      priority: model.priority,
      id: model.x14Id || `{${randomUUID()}}`,
    });

    this.iconSetXform.render(xmlStream, model);

    xmlStream.closeNode();
  }

  createNewModel({attributes}) {
    return {
      type: attributes.type,
      x14Id: attributes.id,
      priority: BaseXform.toIntValue(attributes.priority),
    };
  }

  onParserClose(name, parser) {
    Object.assign(this.model, parser.model);
  }
}

module.exports = CfRuleExtXform;
