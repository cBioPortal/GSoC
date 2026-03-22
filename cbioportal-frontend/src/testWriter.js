import $ from 'jquery';

window._trCountMap = {};

function testObj(me) {
    Object.assign(this, me);
}

testObj.prototype.writeTest = function() {
    console.log(_formatTest(this));
};

window._handleTestReports = function(args, func, params, context, funcName) {
    window._tr = window._tr || {};
    var name = funcName || func.name;
    var paramArr = /\(/.test(params)
        ? params.replace(/[()]/g, '').split(',')
        : null;
    var argArr = Array.from(args);
    var argMap = argArr.map((a, i) => JSON.stringify(a));

    window._trCountMap[name] =
        name in window._trCountMap ? window._trCountMap[name]++ : 0;
    let ret = func.apply(context, args);
    // if there are no constraints or we asre within constraints
    window._tr[name] = window._tr[name] || [];
    if (
        paramArr === null ||
        (window._trCountMap[name] >= paramArr[0] &&
            window._trCountMap[name] <= paramArr[1])
    ) {
        window._tr[name].push(
            new testObj({
                argMap: argMap,
                args: args,
                ret: ret,
                name: funcName || func.name,
                fn: func,
                argNames: func
                    .toString()
                    .match(/\((.*)\)/)[1]
                    .split(', '),
            })
        );
    }
    return ret;
};

window._writeTest = function(name, argJSON, retJSON) {
    showTest(formatTest(name, argJSON, retJSON));
};

window._formatTest = function(report) {
    let argDeclarations = '';
    if (report.argMap.length > 0) {
        argDeclarations = `
        ${report.argNames.reduce(
            (s, a, i) => (s += 'let ' + a + ' = ' + report.argMap[i] + ';\n\n'),
            ''
        )}
        
        `;
    }

    return `
describe('${report.name}', ()=>{

    it('###should do something###',()=>{
        ${argDeclarations}
        const ret = ${report.name}(${report.argNames
        .map((n, i) => n)
        .join(', ')});
        
        const expectedResult = ${JSON.stringify(report.ret)};
        
        assert.equal(ret, expectedResult);
    
    })

});

`;
};

window._showTest = function showTest(txt) {
    $('<textarea/>')
        .css({
            position: 'absolute',
            left: 200,
            right: 200,
            top: 100,
            bottom: 100,
            zIndex: 100,
        })
        .val(txt)
        .appendTo('body');
};
