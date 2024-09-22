const FsPathUtil = (() => {
  return Object.freeze({
    join: (...args) => {
      let p = Util.flattenArray(args).join('/');
      if (p.startsWith('//')) return p.substring(1);
      return p;
    },
    getParentFullPath: (cwd, path) => FsPathUtil.canonicalize(cwd, path + '/..'),
    canonicalize: (cwd, path) => {
      let fullPath = cwd === null || path[0] === '/' ? path : (cwd + '/./' + path);
      let parts = fullPath.split('/').map(t => t.trim());
      let filtered = [];
      for (let part of parts) {
        if (part === '' || part === '.') {
          // skip
        } else if (part === '..' && filtered.length > 0) {
          filtered.pop();
        } else {
          filtered.push(part);
        }
      }
      if (filtered.length === 0) return '/';
      if (filtered[0] === '..') return null;
      return '/' + filtered.join('/');
    },
    isValidName: (() => {
      let badNames = new Set(Util.flattenArray(".git .ds_store thumbs.db desktop.ini con prn aux nul com# lpt#"
        .split(' ')
        .map(n => {
          let p = n.split('#');
          if (p.length > 1) return Util.range(10).map(i => p.join('' + i));
          return n;
        })));
      let badChars = new Set('\\/:?!@$*"<>|'.split(''));

      return (n) => {
        if (!n ||
            n.trim() !== n ||
            n.endsWith('.') ||
            n.length > 240 ||
            badNames.has(n.toLowerCase()) ||
            n.split('').filter(c => badChars.has(c)).length) return false;
        return true;
      };
    })(),
  });
})();
