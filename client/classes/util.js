const Util = (() => {
  const Util = {};

  Util.binaryRuleFactory = (...args) => {
    args = args.filter((e) => typeof e == 'number' && e >= 0 && Math.floor(e) == e);
    let str = '() => 0';
    if (args.length)
      str = Util.indentTrim(`
        (cell) => {
          let c = cell.count;
          return ${args.map((e) => `c == ${e}`).join(' || ')} ? 1 : 0;
        }
      `);
    return eval(str);
  };

  Util.symmetricRuleFactory = (...args) => {
    args = args.filter((e) => typeof e == 'number' && e >= 0 && Math.floor(e) == e);
    let str = '() => 0';
    if (args.length)
      str = Util.indentTrim(`
        (cell) => {
          let c = cell.count;
          let n = cell.neighborhood;
          if (cell.state) {
            if (${args.map((e) => `c == ${e}`).join(' || ')})
              return 1;
            else
              return 0;
          }
          else {
            if (${args.map((e) => `c == n - ${e}`).join(' || ')})
              return 0;
            else
              return 1;
          }
        }
      `);
    return eval(str);
  };

  Util.setColorRange = (opts={}) => {
    let [min, max] = opts.range || [0, Board.config.maxNumStates];
    let range = max - min;
    let hBase = opts.h || 0;
    let sBase = opts.s != null ? opts.s : 0.5;
    let lBase = opts.l != null ? opts.l : 0.5;
    let aBase = opts.a != null ? opts.a : 1;
    let hDelta = opts.hDelta != null ? opts.hDelta : 360;
    let sDelta = opts.sDelta || 0;
    let lDelta = opts.lDelta || 0;
    let aDelta = opts.aDelta || 0;
    let colors = Board.config.colors.slice();
    for (let i = min; i < max; i++) {
      let q = i - min;
      let h = Hexular.math.mod((hBase + q * hDelta / range), 360);
      let s = sBase + q * sDelta / range;
      let l = lBase + q * lDelta / range;
      let a = aBase + q * aDelta / range;
      colors[i] = Color.hslaToRgba(h, s, l, a);
    }
    Board.config.setColors(colors);
  };

  Util.rotateColors = (offset=1) => {
    let colors = [];
    let len = Math.min(Board.config.maxNumStates, Board.config.colors.length);
    for (let i = 0; i < len; i++) {
      let color = Board.config.colors[(i - offset + len) % len];
      colors.push(color);
    }
    Board.config.setColors(colors);
  };

  Util.pairsToObject = (tuples) => {
    let obj = {};
    tuples.forEach(([key, value]) => obj[key] = value);
    return obj;
  };

  Util.sexToInt = (str, base=60) => {
    let p = str.split(':').map((e) => parseInt(e));
    let num = 0;
    while (p.length) {
      let val = p.shift();
      let col = p.length;
      val *= (base ** col);
      num += val;
    }
    return num;
  }

  // ugghh
  Util.groundStart = (delay=1) => {
    let board = Board.instance;
    if (board.running)
      return;
    let config = Board.config;
    let model = Board.model;
    let states = model.cells.map((cell) => cell.state);
    board.addHook('autopauseStep', () => {
      model.changed = true;
      if (!--delay) {
        model.cells.forEach((e, i) => e.setState(states[i]));
        board.removeHook('Util.groundStart');
      }
    }, {id: 'Util.groundStart'});
    board.clear();
    board.resetDrawStep();
    board.drawSync();
  }

  Util.stateHistogram = () => {
    return Board.model.cells.reduce((a, e) => {
      a[e.state] = a[e.state] || 0;
      a[e.state] += 1;
      return a;
    }, {});
  }

  Util.translateStates = (cubicVector) => {
    for (let i = 0; i < 3; i++) {
      if (cubicVector[i] == null)
        cubicVector[i] = -cubicVector[(i + 1) % 3] - cubicVector[(i + 2) % 3];
    }
    // I feel like these are going to be pretty opaque errors for most ppl
    if (cubicVector.filter((e) => isNaN(parseInt(e))).length)
      throw new Hexular.HexError('Requires at least 2 cubic coordinates');
    if (!cubicVector.reduce((a, e, i, s) => a && e == -s[(i + 1) % 3] - s[(i + 2) % 3], true))
      throw new Hexular.HexError('Inconsistent cubic coordinates');
    let [u, v] = cubicVector.map((e) => Math.abs(e));
    let un = cubicVector[0] > 0 ? 1 : 4;
    let vn = cubicVector[1] > 0 ? 2 : 5;
    let transMap = new Map();
    Board.model.eachCell((cell) => {
      let p = cell;
      for (let i = 0; i < u; i ++)
        p = p.nbrs[un];
      for (let i = 0; i < v; i++)
        p = p.nbrs[vn];
      transMap.set(p, cell.state);
    });
    // Set states
    Board.instance.newHistoryState();
    transMap.forEach((state, cell) => {
      cell.setState(state);
    });
    Board.instance.draw();
  };

  Util.preventClose = () => {
    window.onbeforeunload = (ev) => {
      ev.preventDefault();
      return 'r u sure lol?'
    };
  };

  Util.findDuplicateSteps = (opts={}) => {
    let radius = opts.radius || Board.config.order;
    let cell = opts.cell || Board.instance.debugSelected || Board.model.cells[0];
    let cells = cell.wrap(radius);
    let coord = cell.coord;
    let halt = !!opts.halt;
    let map = window.stateMap = new Map();
    let dups = window.duplicates = [];
    let currentBoard = Board.instance;

    let getStateKey = () => {
      if (currentBoard != Board.instance) {
        currentBoard = Board.instance;
        cell = Board.model.cellAtCubic(coord);
        cells = cell.wrap(radius);
      }
      return cells.map((e) => ('0' + e.state.toString(16)).slice(-2)).join('');
    }

    let fn = () => {
      let stateKey = getStateKey();
      let cur = map.get(stateKey);
      if (cur != null) {
        window.testmap = map;
        dups.push([cur, Board.config.steps, stateKey]);
        Board.instance.setMessage(`Duplicate at ${cur}, ${Board.config.steps}!`);
        console.log(`Duplicate at ${cur}, ${Board.config.steps}!`);
        if (halt)
          Board.instance.stop();
      }
      map.set(stateKey, Board.config.steps);
    }
    return Board.instance.addHook('step', fn, {id: 'Util.findDuplicateSteps', map, dups});
  };

  Util.setBreakpoints = (breakpoints) => {
    Board.config.meta.breakpoints = breakpoints || Board.config.meta.breakpoints || [];
    return Board.instance.addHook('step', () => {
      if (Board.config.meta.breakpoints.includes(Board.config.steps)) {
        Board.instance.stop();
      }
    }, {id: 'Util.setBreakpoints'});
  };

  Util.debugTimer = (log=true) => {
    let intervals = window.debugIntervals = [];
    let t;
    let fn = () => {
      let oldT = t;
      t = Date.now();
      if (oldT) {
        let delta = t - oldT;
        log && console.log(delta);
        intervals.push(delta);
      }
    }
    return Board.instance.addHook('step', fn, {id: 'Util.debugTimer', intervals});
  };

  Util.clearUtilHooks = () => {
    let ids = [
      'Util.findDuplicateSteps',
      'Util.setBreakpoints',
      'Util.debugTimer',
      'Util.groundStart',
    ];
    ids.forEach((e) => Board.instance.removeHook(e));
  },

  Util.debugCell = (cell, fn) => {
    if (cell == Board.instance.debugSelected)
      fn(cell);
  };

  Util.indentTrim = (string) => {
    let lines = string.split('\n');
    let min = Infinity;
    for (let line of lines) {
      let indent = line.match(/^( *?)[^ ].*$/)
      if (indent) {
        min = Math.min(indent[1].length, min);
      }
    }
    min = min < Infinity ? min : 0;
    return lines.map((e) => e.substring(min)).filter((e) => e.length > 0).join('\n');
  };

  Util.execCommandBroken = () => { // *sigh*
    if (!document.execCommand || !document.queryCommandSupported)
      return true;
    let lastFocus = document.activeElement;
    let elem = document.createElement('textarea');
    elem.style.position = 'fixed';
    elem.style.left = '0';
    elem.style.top = '0';
    elem.style.opacity = '0';
    document.body.appendChild(elem);
    elem.value = `Looking at you Firefox`;
    elem.focus();
    elem.setSelectionRange(0, 15);
    document.execCommand('delete', false);
    document.execCommand('insertText', false, 'Wtf ');
    let str = elem.value;
    lastFocus && lastFocus.focus();
    elem.remove();
    return str.length == 22 ? true : false;
  };

  Util.handleTextFormat = (elem, ev) => {
    let cursor = elem.selectionStart;
    let text = elem.value;
    let beforeCursor = text.slice(0, cursor);
    let afterCursor = text.slice(cursor);
    if (
      ev.inputType == 'insertLineBreak' ||
      text[cursor -1] == '\n' && ev.inputType == 'insertText' && !ev.data // wtf
    ) {
      let rows = beforeCursor.split('\n');
      let lastRow = rows.slice(-2)[0];
      let match = lastRow && lastRow.match(/^\s+/);
      let spaces = match && match[0] || '';
      Util.execInsert(elem, spaces, cursor);
      elem.setSelectionRange(cursor + spaces.length, cursor + spaces.length);
    }
  };

  Util.execInsert = (elem, str, startIdx, endIdx) => {
    endIdx = endIdx || startIdx;
    if (!Board.instance.execCommandBroken) {
      elem.focus();
      if (startIdx) {
        elem.setSelectionRange(startIdx, endIdx);
      }
      else {
        elem.select();
        document.execCommand("delete", false);
      }
      document.execCommand("insertText", false, str);
    }
    else {
      if (!startIdx)
        elem.value = str;
      else
        elem.value = elem.value.slice(0, startIdx) + str + elem.value.slice(endIdx);
    }
  };

  Util.fit = (parent, child, action='cover') => {
    let w, h;
    if (!action) {
      [w, h] = child;
    }
    else if (action == 'stretch') {
      [w, h] = parent;
    }
    else {
      let [wp, hp] = parent;
      let [wc, hc] = child;
      let ap = wp / hp;
      let ac = wc / hc;
      let cover = action == 'cover';
      if (cover == ac < ap) {
        w = wp;
        h = wp * hc / wc;
      }
      else { // action == 'contain'
        h = hp;
        w = hp * wc / hc;
      }
    }
    return [w, h];
  }

  Util.shallowPrettyJson = (data, maxLevels=2, indentText='  ') => {
    let json = JSON.stringify(data);
    let str = '';
    let level = 0;
    let openers = ['[', '{'];
    let closers = [']', '}'];
    let quote = false;
    let indent = (level) => '\n' + indentText.repeat(level);
    for (let i = 0; i < json.length; i++) {
      let char = json[i];
      let next = json[i + 1];
      str += char;
      if (char == '"' && json[i - 1] != '\\')
        quote = !quote;
      if (quote)
        continue;
      let opener = openers.includes(char);
      let closer = closers.includes(char);
      let closerNext = closers.includes(next);
      opener && ++level;
      closer && --level;
      let indentable = level <= maxLevels;

      if (char == ':') {
        str += ' ';
      }
      else if (indentable) {
        if (opener && !closerNext) {
          str += indent(level);
        }
        else if (closer || char == ',') {
          if (next == ',') {
            i ++;
            str += ',';
          }
          str += indent(closerNext ? level - 1 : level);
        }
        else if (closerNext) {
          str += indent(level - 1);
        }
      }
      else if (char == ',') {
        str += ' ';
      }
    }
    return str;
  };

  Util.loadImageAsUrl = () => {
    return new Promise((resolve, reject) => {
      let board = Board.instance;
      let fileLoader = new FileLoader('.jpg,.jpeg,.gif,.png,.svg,.bmp', {reader: 'readAsArrayBuffer'});
      fileLoader.onload = (result) => {
        if (result) {
          let blob = new Blob([result], {type: fileLoader.fileTypes[0]});
          resolve(window.URL.createObjectURL(blob));
        }
      };
      fileLoader.prompt();
    });
  }

  return Util;
})();
