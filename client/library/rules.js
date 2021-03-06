const Rules = (() => {
  const coreRules = Hexular.rules;
  const customRules = {
    binary1: Util.binaryRuleFactory(1),

    binary2: Util.binaryRuleFactory(2),

    binary3: Util.binaryRuleFactory(3),

    binary12: Util.binaryRuleFactory(1, 2),

    binary23: Util.binaryRuleFactory(2, 3),

    binary34: Util.binaryRuleFactory(3, 4),

    symmetric36: Util.symmetricRuleFactory(3, 6),

    stepDown: (cell) => cell.state - 1,

    stepUp: (cell) => cell.state + 1,

    xor: (cell) => cell.map.reduce((a, e) => e ^ a, 0),

    xorCount: (cell) => cell.count % 2,

    average: (cell) => cell.average,

    count: (cell) => cell.count,

    total: (cell) => cell.total,

    min: (cell) => cell.min,

    max: (cell) => cell.max,

    minUp: (cell) => cell.min + 1,

    maxDown: (cell) => cell.max - 1,

    rhombicLife: (cell) => {
      let t = cell.with[6].total + cell.nbrs[7].state + cell.nbrs[10].state;
      return cell.state && (t == 2 || t == 3) || t == 3 ? 1 : 0;
    },

    squiggle6: (cell) => {
      let h = cell.histogram;
      for (let i = cell.state; i < 7; i++)
        if (i && h[i])
          return cell.state + i;
      return cell.average;
    },

    sub1: (cell) => {
      let m = cell.map;
      let c = 0;
      for (let i = 0; i < m.length; i++) {
        if (m[i] > cell.state) {
          c ++;
          if (c > 1) {
            return cell.average;
          }
        }
      }
      if (c == 1)
        return cell.state - 1;
      return cell.average;
    },

    fancytown: (cell) => {
      const tot = cell.total;
      if (tot > 2 && tot < 5)
        return cell.state + 1;
      else if (tot >= 9)
        return cell.state - 1;
      else
        return cell.state;
    },

    // SRB rules

    bicameral: Hexular.util.ruleBuilder([
      0b000011,
      0b000110,
      0b001011,
      0b001100,
      0b001110,
      0b010010,
      0b010011,
      0b010110,
      0b011000,
      0b011001,
      0b011010,
      0b011011,
      0b011100,
      0b011101,
      0b011110,
      0b011111,
      0b100001,
      0b100011,
      0b100110,
      0b101011,
      0b101101,
      0b101110,
      0b110000,
      0b110001,
      0b110010,
      0b110011,
      0b110100,
      0b110101,
      0b110110,
      0b110111,
      0b111011,
      0b111110,
      0b111111,
    ], {matchRel: true, rel: true}),

    bicameralite: Hexular.util.ruleBuilder([
      0b000011,
      0b000110,
      0b001100,
      0b001110,
      0b010010,
      0b011000,
      0b011011,
      0b011100,
      0b011110,
      0b011111,
      0b100001,
      0b100011,
      0b101101,
      0b110000,
      0b110001,
      0b110011,
      0b110110,
      0b110111,
      0b111011,
      0b111110,
      0b111111,
    ], {matchRel: true, rel: true}),

    ennead: Hexular.util.ruleBuilder([
      0b001001,
      0b010010,
      0b100100,
      0b000011,
      0b000110,
      0b001100,
      0b011000,
      0b110000,
      0b100001,
    ], {matchRel: true}),

    enneadPlus: Hexular.util.ruleBuilder([
      0b001001,
      0b010010,
      0b100100,
      0b000011,
      0b000110,
      0b001100,
      0b011000,
      0b110000,
      0b100001,
    ], {miss: -1, missRel: true, matchRel: true, rel: true}),

    hexad: Hexular.util.ruleBuilder([
      0b000011,
      0b000110,
      0b001100,
      0b011000,
      0b110000,
      0b100001,
    ], {miss: -1, missRel: true, matchRel: true}),

    expander: Hexular.util.ruleBuilder([
      0b000001,
      0b000010,
      0b000011,
      0b000100,
      0b000110,
      0b000111,
      0b001000,
      0b001100,
      0b001110,
      0b001111,
      0b010000,
      0b011000,
      0b011100,
      0b011110,
      0b100000,
      0b100001,
      0b100011,
      0b100111,
      0b110000,
      0b110001,
      0b110011,
      0b111000,
      0b111001,
      0b111100,
      0b111111,
    ], {miss: -1, match: 1, missRel: true, matchRel: true}),

    probe: Hexular.util.ruleBuilder([
      0b000011,
      0b000110,
      0b001001,
      0b001100,
      0b001111,
      0b010010,
      0b011000,
      0b011011,
      0b011110,
      0b100001,
      0b100100,
      0b100111,
      0b101101,
      0b110000,
      0b110011,
      0b110110,
      0b111001,
      0b111100,
      0b111111,
    ]),

    triforce: Hexular.util.ruleBuilder([
      0b000101,
      0b000110,
      0b001001,
      0b001010,
      0b001011,
      0b001101,
      0b001111,
      0b010001,
      0b010010,
      0b010011,
      0b010100,
      0b010110,
      0b011000,
      0b011001,
      0b011010,
      0b011011,
      0b011110,
      0b100001,
      0b100010,
      0b100100,
      0b100101,
      0b100110,
      0b100111,
      0b101000,
      0b101001,
      0b101100,
      0b101101,
      0b110010,
      0b110011,
      0b110100,
      0b110110,
      0b111001,
      0b111100,
      0b111111,
    ]),

    fractalLeft: Hexular.util.ruleBuilder([
      0b010000,
      0b000100,
      0b000001,
    ]),

    fractalRight: Hexular.util.ruleBuilder([
      0b100000,
      0b001000,
      0b000010,
    ]),

    lineFilter: Hexular.util.ruleBuilder([
      0b000000,
      0b001001,
      0b010010,
      0b100100,
    ], {miss: 1, match: 0}),

    retractor: Hexular.util.ruleBuilder([
      0b000111,
      0b001110,
      0b011100,
      0b111000,
      0b110001,
      0b100011,
      0b100111,
      0b001111,
      0b011110,
      0b111100,
      0b111001,
      0b110011,
    ], {match: -1, missRel: true, matchRel: true}),

    uncial: Hexular.util.ruleBuilder([
      0b000011,
      0b000110,
      0b000111,
      0b001100,
      0b001110,
      0b011000,
      0b011100,
      0b100001,
      0b100011,
      0b110000,
      0b110001,
      0b111000,
    ], {miss: -1, missRel: true, matchRel: true, rel: true}),

    // TRB Rules

    tripleReactor: Hexular.util.templateRuleBuilder([{
      applyFn: (a, b) => a == b,
      matchFn: (c, a, b) => c,
      match: 1,
      miss: 0,
      matchRel: 1,
      missRel: 1,
      sym: 1,
      states: [-1, 0, 0, 0, 0, 1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    },
    {
      applyFn: (a, b) => a == b,
      matchFn: (c, a, b) => c,
      match: 1,
      miss: 0,
      matchRel: 1,
      missRel: 1,
      sym: 1,
      states: [-1, 1, 1, 0, 1, 1, 0, -1, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, 0],
    },
    {
      applyFn: (a, b) => a == b,
      matchFn: (c, a, b) => c,
      match: 1,
      miss: 0,
      matchRel: 1,
      missRel: 1,
      sym: 1,
      states: [-1, -1, 1, -1, -1, 1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1],
    },
    {
      applyFn: (a, b) => a == b,
      matchFn: (c, a, b) => c,
      match: -1,
      miss: 0,
      matchRel: 1,
      missRel: 1,
      sym: 0,
      states: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    }]),
  };
  let entries = Object.entries(customRules);
  entries.sort((a, b) => {
    let strOrder = a[0].localeCompare(b[0]);
    let [an, bn] = [a[1], b[1]].map((e) => e.n != null ? 1 : -1);
    return an ^ bn == -2 ? an - bn : strOrder;
  });
  let rules = Object.assign({}, coreRules, Config.toObject(entries));
  return rules;
})();
