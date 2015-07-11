function Levenshtein(maxLen, caseSensitive) {
    if (!(this instanceof Levenshtein)) {
        return new Levenshtein(maxLen, caseSensitive);
    }

    this.MAX_LEN = maxLen;
    this.caseSensitive = !!caseSensitive;
    this.m = [];
    this._init();
    return this;
}

Levenshtein.prototype = {
    MATCH: 0,
    INSERT: 1,
    DELETE: 2,

    _init: function() {
        var i, j;
        var m = this.m;
        m.length = this.MAX_LEN+1;

        for (i = 0; i < m.length; ++i) {
            if (!Array.isArray(m[i])) {
                m[i] = [];
                for (j = 0; j < m.length; ++j) {
                    m[i][j] = {cost: 0, parent: 0};
                }
            }
            this._initFirstRow(i);
            this._initFirstColumn(i);
        }
    },

    _initFirstRow: function(i) {
        var m = this.m;
        m[0][i].cost = i;
        if (i > 0) m[0][i].parent = this.INSERT;
        else m[0][i].parent = -1;
    },

    _initFirstColumn: function(i) {
        var m = this.m;
        m[i][0].cost = i;
        if (i > 0) m[i][0].parent = this.DELETE;
        else m[i][0].parent = -1;
    },

    _matchType: function(i, j) {
        if (this.s1[i] === this.s2[j]) return 'M';
        else return 'S';
    },

    _reconstructPath: function(i, j) {
        var self = this;
        var m = this.m;
        var path = [];
        var s1 = this.s1;
        var s2 = this.s2;
        var MATCH = this.MATCH;
        var INSERT = this.INSERT;
        var DELETE = this.DELETE;

        function reconstruct(i, j) {
            if (m[i][j].parent === -1) return;

            var matchtype = self._matchType(i, j);

            if (m[i][j].parent === MATCH) {
                reconstruct(i-1, j-1);
                path.push({
                    i: i,
                    j: j,
                    op: matchtype,
                    letter: matchtype === 'M' ? s2[j] : s1[i] + ' => ' + s2[j],
                });
                return;
            }
            if (m[i][j].parent === INSERT) {
                reconstruct(i, j-1);
                path.push({
                    i: i,
                    j: j,
                    op: 'I',
                    letter: s2[j],
                });
                return;
            }
            if (m[i][j].parent === DELETE) {
                reconstruct(i-1, j);
                path.push({
                    i: i,
                    j: j,
                    op: 'D',
                    letter: s1[i],
                });
                return;
            }
        }

        reconstruct(i, j);
        return path;
    },

    _levenshtein: function() {
        var opt = [];
        var s1 = this.s1;
        var s2 = this.s2;
        var MATCH = this.MATCH;
        var INSERT = this.INSERT;
        var DELETE = this.DELETE;
        var m = this.m;
        var i, j, k;

        if (s1.length <= 1) return s2.length-1;
        if (s2.length <= 1) return s1.length-1;

        for (i = 1; i < s1.length; ++i) {
            for (j = 1; j < s2.length; ++j) {
                opt[MATCH]  = m[i-1][j-1].cost + this.matchCost(s1[i], s2[j]);
                opt[INSERT] = m[i][j-1].cost + 1;
                opt[DELETE] = m[i-1][j].cost + 1;

                m[i][j].cost = opt[MATCH];
                m[i][j].parent = MATCH;

                for (k = INSERT; k <= DELETE; ++k) {
                    if (opt[k] < m[i][j].cost) {
                        m[i][j].cost = opt[k];
                        m[i][j].parent = k;
                    }
                }
            }
        }

        // goal_cell(s, t, i, j);
        return m[i-1][j-1].cost;
    },

    matchCost: function(c1, c2) {
        if (c1 === c2) return 0;
        return 1;
    },

    process: function(s1, s2) {
        var len1, len2, numSteps, path;

        // strings are prepended with a space to make
        // the code for indexing the matrix easier to read
        s1 = ' ' + s1.slice(0, this.MAX_LEN);
        s2 = ' ' + s2.slice(0, this.MAX_LEN);

        if (!this.caseSensitive) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();
        }

        this.s1 = s1;
        this.s2 = s2;

        len1 = s1.length-1;
        len2 = s2.length-1;

        numSteps = this._levenshtein();
        path = this._reconstructPath(len1, len2);

        // aid user inspection of the processed strings
        // by removing the prepended space for each
        this.s1 = s1.slice(1);
        this.s2 = s2.slice(1);

        this.results = {
            path: path,
            numSteps: numSteps,
        };

        return this;
    },
};
