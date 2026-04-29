const testXformHelper = require('../../test-xform-helper');

const XmlStream = verquire('utils/xml-stream');
const CfRuleExtXform = verquire('xlsx/xform/sheet/cf-ext/cf-rule-ext-xform');

const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

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
  {
    title: 'Icon Set - prepare assigns UUID',
    create() {
      return new CfRuleExtXform();
    },
    initialModel: {
      type: 'iconSet',
      priority: 1,
      iconSet: '3Triangles',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    },
    xml: `
      <x14:cfRule type="iconSet" priority="1" id="{${FAKE_UUID.toUpperCase()}}">
        <x14:iconSet iconSet="3Triangles">
          <x14:cfvo type="percent"><xm:f>0</xm:f></x14:cfvo>
          <x14:cfvo type="percent"><xm:f>33</xm:f></x14:cfvo>
          <x14:cfvo type="percent"><xm:f>67</xm:f></x14:cfvo>
        </x14:iconSet>
      </x14:cfRule>
    `,
    tests: ['prepare-render'],
  },
  {
    title: 'DataBar - prepare assigns UUID',
    create() {
      return new CfRuleExtXform();
    },
    initialModel: {
      type: 'dataBar',
      cfvo: [
        {type: 'num', value: 5},
        {type: 'num', value: 20},
      ],
    },
    xml: `
      <x14:cfRule type="dataBar" id="{${FAKE_UUID.toUpperCase()}}">
        <x14:dataBar minLength="0" maxLength="100">
          <x14:cfvo type="num"><xm:f>5</xm:f></x14:cfvo>
          <x14:cfvo type="num"><xm:f>20</xm:f></x14:cfvo>
        </x14:dataBar>
      </x14:cfRule>
    `,
    tests: ['prepare-render'],
  },
];

describe('CfRuleExtXform', () => {
  let originalRandomUUID;

  beforeEach(() => {
    originalRandomUUID = globalThis.crypto.randomUUID;
    globalThis.crypto.randomUUID = () => '00000000-0000-0000-0000-000000000000';
  });

  afterEach(() => {
    globalThis.crypto.randomUUID = originalRandomUUID;
  });

  testXformHelper(expectations);

  it('renderIconSet uses fallback UUID when x14Id is missing', () => {
    const xform = new CfRuleExtXform();
    const xmlStream = new XmlStream();
    xform.render(xmlStream, {
      type: 'iconSet',
      priority: 1,
      iconSet: '3Triangles',
      cfvo: [
        {type: 'percent', value: 0},
        {type: 'percent', value: 33},
        {type: 'percent', value: 67},
      ],
    });

    expect(xmlStream.xml).to.contain(`id="{${FAKE_UUID}}"`);
  });
});
