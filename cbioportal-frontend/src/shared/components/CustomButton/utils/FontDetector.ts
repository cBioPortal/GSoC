/**
 * TypeScript class to detect if a font is installed
 *
 * ORIGINAL HEADER:
 * JavaScript code to detect available availability of a
 * particular font in a browser using JavaScript and CSS.
 *
 * Author : Lalit Patel
 * Website: http://www.lalit.org/lab/javascript-css-font-detect/
 * License: Apache Software License 2.0
 *          http://www.apache.org/licenses/LICENSE-2.0
 * Version: 0.15 (21 Sep 2009)
 *          Changed comparision font to default from sans-default-default,
 *          as in FF3.0 font of child element didn't fallback
 *          to parent element if the font is missing.
 * Version: 0.2 (04 Mar 2012)
 *          Comparing font against all the 3 generic font families ie,
 *          'monospace', 'sans-serif' and 'sans'. If it doesn't match all 3
 *          then that font is 100% not available in the system
 * Version: 0.3 (24 Mar 2012)
 *          Replaced sans with serif in the list of baseFonts
 * TypeScript Reactor: July 3, 2024
 */

/**
 * Usage: d = new Detector();
 *        d.detect('font name');
 */

export interface IFontDetector {
    detect: (font: string) => boolean;
}

export class FontDetector implements IFontDetector {
    // a font will be compared against all the three default fonts.
    // and if it doesn't match all 3 then that font is not available.
    baseFonts = ['monospace', 'sans-serif', 'serif'];

    // we use m or w because these two characters take up the maximum width.
    // And we use a LLi so that the same matching fonts can get separated
    testString = 'mmmmmmmmmmlli';

    // we test using 72px font size, we may use any size. I guess larger the better.
    testSize = '72px';

    detect: (font: string) => boolean;

    constructor() {
        // precompute for the test
        var defaultWidth: { [key: string]: number } = {};
        var defaultHeight: { [key: string]: number } = {};

        var html = document.getElementsByTagName('body')[0];

        // create a SPAN in the document to get the width of the text we use to test
        var span = document.createElement('span');
        span.style.fontSize = this.testSize;
        span.innerHTML = this.testString;

        const baseFonts = this.baseFonts;
        for (var index in baseFonts) {
            //get the default width for the three base fonts
            span.style.fontFamily = baseFonts[index];
            html.appendChild(span);
            defaultWidth[baseFonts[index]] = span.offsetWidth;
            defaultHeight[baseFonts[index]] = span.offsetHeight;
            html.removeChild(span);
        }

        // expose a detect() function that leverages that state
        this.detect = (font: string): boolean => {
            // console.log("detect:" + font);
            for (var index in baseFonts) {
                // name of the font along with the base font for fallback.
                span.style.fontFamily = font + ',' + baseFonts[index];
                // add the span with the test font, and see if it's actually using a baseFont
                html.appendChild(span);
                var matched =
                    span.offsetWidth != defaultWidth[baseFonts[index]] ||
                    span.offsetHeight != defaultHeight[baseFonts[index]];
                html.removeChild(span);
                if (matched) {
                    return true;
                }
            }
            return false;
        };
    }
}
