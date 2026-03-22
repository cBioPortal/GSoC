import $ from 'jquery';

export function writeTest(
    name: string,
    argJSON: string[],
    retJSON: string
): void {
    showTest(formatTest(name, argJSON, retJSON));
}

// this is decorator for method
export function testIt(obj: any, methodname: string, des: any) {
    var old = des.value;
    des.value = function(...args: any[]) {
        return (window as any)._handleTestReports(
            args,
            old,
            'fdsa,fdas',
            this,
            methodname
        );
    };
}

function formatTest(functionName: string, argMap: string[], retJSON: string) {
    return `
describe('${functionName}', ()=>{

    it('###should do something###',()=>{
        
        ${argMap.reduce((s, a) => (s += a + '\n\n'), '')}
        
        const ret = ${functionName}(${argMap
        .map((n, i) => 'arg' + i)
        .join(', ')});
        
        const expectedResult = ${retJSON};
        
        assert.equal(ret, expectedResult);
    
    })

});

`;
}

function showTest(txt: string) {
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
}

// var old = extendSamplesWithCancerType;
//
// (extendSamplesWithCancerType as any) = function(){
//     var args = Array.from(arguments);
//     var argMap = args.map((a,i)=>`var arg${i}=${JSON.stringify(a)}`);
//     var ret = old.apply(this,arguments);
//     writeTest("me", argMap, JSON.stringify(ret));
//     return ret;
// }
