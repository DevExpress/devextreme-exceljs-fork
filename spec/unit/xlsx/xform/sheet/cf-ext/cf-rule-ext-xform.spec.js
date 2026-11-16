const testXformHelper = require('../../test-xform-helper');

const CfRuleExtXform = verquire('xlsx/xform/sheet/cf-ext/cf-rule-ext-xform');

const expectations = [
  {
    title: 'Icon Set',
    create() {
      return new CfRuleExtXform();
    },
    preparedModel: {
      type: 'iconSet',
      priority: 1,
      x14Id: 'x14-id',
      iconSet: '3Triangles',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
    xml: `
      <x14:cfRule type="iconSet" priority="1" id="x14-id">
        <x14:iconSet iconSet="3Triangles">
          <x14:cfvo type="percent"><xm:f>0</xm:f></x14:cfvo>
          <x14:cfvo type="percent"><xm:f>33</xm:f></x14:cfvo>
          <x14:cfvo type="percent"><xm:f>67</xm:f></x14:cfvo>
        </x14:iconSet>
      </x14:cfRule>
    `,
    parsedModel: {
      type: 'iconSet',
      priority: 1,
      x14Id: 'x14-id',
      iconSet: '3Triangles',
      reverse: false,
      showValue: true,
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'Databar',
    create() {
      return new CfRuleExtXform();
    },
    preparedModel: {
      type: 'dataBar',
      x14Id: 'x14-id',
      cfvo: [
        {type: 'num', value: 5},
        {type: 'num', value: 20},
      ],
    },
    xml: `
      <x14:cfRule type="dataBar" id="x14-id">
        <x14:dataBar minLength="0" maxLength="100">
          <x14:cfvo type="num"><xm:f>5</xm:f></x14:cfvo>
          <x14:cfvo type="num"><xm:f>20</xm:f></x14:cfvo>
        </x14:dataBar>
      </x14:cfRule>
    `,
    parsedModel: {
      type: 'dataBar',
      x14Id: 'x14-id',
      minLength: 0,
      maxLength: 100,
      border: false,
      gradient: true,
      // reverse: false,
      // showValue: true,
      negativeBarColorSameAsPositive: true,
      negativeBarBorderColorSameAsPositive: true,
      axisPosition: 'auto',
      direction: 'leftToRight',
      cfvo: [
        {type: 'num', value: 5},
        {type: 'num', value: 20},
      ],
    },
    tests: ['render', 'parse'],
  },
];

describe('CfRuleExtXform', () => {
  testXformHelper(expectations);

  describe('prepare', () => {
    const x14IdPattern = /^\{[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}\}$/;
    const prepareExtRule = () => {
      const model = {type: 'iconSet', iconSet: '3Triangles'};
      new CfRuleExtXform().prepare(model);
      return model.x14Id;
    };

    it('generates a v4 UUID x14Id with crypto.randomUUID', () => {
      expect(prepareExtRule()).to.match(x14IdPattern);
    });

    describe('without crypto.randomUUID (browser on a non-secure page)', () => {
      // Hides the Crypto.prototype method; `delete` restores it
      const stubCrypto = (name, value) =>
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        Object.defineProperty(globalThis.crypto, name, {value, configurable: true});

      beforeEach(() => {
        stubCrypto('randomUUID', undefined);
      });

      afterEach(() => {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        delete globalThis.crypto.randomUUID;
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        delete globalThis.crypto.getRandomValues;
      });

      [
        {randomByte: 0x00, expected: '{00000000-0000-4000-8000-000000000000}'},
        {randomByte: 0xff, expected: '{FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF}'},
      ].forEach(({randomByte, expected}) => {
        it(`sets the version and variant bits when all random bytes are 0x${randomByte.toString(16)}`, () => {
          stubCrypto('getRandomValues', array => array.fill(randomByte));

          expect(prepareExtRule()).to.equal(expected);
        });
      });

      it('generates a v4 UUID x14Id with crypto.getRandomValues', () => {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        expect(globalThis.crypto.randomUUID).to.be.undefined();

        const first = prepareExtRule();
        const second = prepareExtRule();

        expect(first).to.match(x14IdPattern);
        expect(second).to.match(x14IdPattern);
        expect(first).to.not.equal(second);
      });
    });
  });
});
