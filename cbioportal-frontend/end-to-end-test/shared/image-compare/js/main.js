const isLocalHost = /127.0.0.1|localhost/.test(window.location.hostname);

var runMode = 'remote';

const LI_INDEX_ATTR = 'data-index';

function getURLParameterByName(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    return results === null
        ? ''
        : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function getRootUrl(href) {
    if (href.includes('circle-artifacts')) {
        return href.substring(0, href.lastIndexOf('/')) + '/';
    } else {
        return './';
    }
}

var rootUrl = getRootUrl(window.location.href);

var reportUrl = isLocalHost
    ? './results/completeResults.json'
    : `./completeResults.json`;

var diffSliderMode = true;

function updateComparisonMode() {
    if (!diffSliderMode) {
        $('#juxta').show();
        $('#sidebyside').hide();
    } else {
        $('#sidebyside').show();
        $('#juxta').hide();
    }
}

$(document).on('click', '#toggleDiffModeBtn', () => {
    diffSliderMode = !diffSliderMode;
    updateComparisonMode();
});

function buildData(reportData, screenshotUrls = {}) {
    const data = reportData.map(test => {
        const testName = test.name.replace(/\s/g, '_').toLowerCase();
        const imagePath = `/${testName}_element_chrome_1600x1000.png`;
        const rootUrl = isLocalHost
            ? `/${runMode}/screenshots/`
            : './screenshots/';

        // Add the screenshot URL from the loaded URLs file
        const testWithUrl = {
            ...test,
            screenshotUrl: screenshotUrls[testName] || '',
        };

        return {
            screenImagePath: `${rootUrl}screen${imagePath}`,
            diffImagePath: `${rootUrl}diff${imagePath}`,
            refImagePath: `${rootUrl}reference${imagePath}`,
            imageName: testName,
            test: testWithUrl,
        };
    });

    return data;
}

function renderList(data) {
    var $div = $('<div></div>')
        .prependTo('body')
        .css({
            'max-height': 350,
            overflow: 'scroll',
        });
    var $list = $('<ul></ul>').appendTo($div);

    data.forEach((item, index) => {
        var test = item.test;
        $(
            `<li><a ${LI_INDEX_ATTR}='${index}' href="javascript:void(0)">${item.imageName}</a></li>`
        )
            .appendTo($list)
            .click(function() {
                $list.find('a').removeClass('active');
                $(this)
                    .find('a')
                    .addClass('active');
                selectedSSIndex = parseInt(
                    $(this)
                        .find('a')
                        .attr(LI_INDEX_ATTR)
                );
                buildDisplay(item, data, '', runMode);
                clearSideBySideInterval();
            });
    });

    // click first one
    var firstLink = $list.find('a').get(0);
    if (firstLink) {
        firstLink.click();
    }

    function clampSSIndex(i) {
        return Math.max(Math.min(i, data.length - 1), 0);
    }

    function selectSS() {
        $(`a[${LI_INDEX_ATTR}="${selectedSSIndex}"]`).click();
    }

    $('#nextSS').click(() => {
        selectedSSIndex = clampSSIndex(selectedSSIndex + 1);
        selectSS();
    });
    $('#prevSS').click(() => {
        selectedSSIndex = clampSSIndex(selectedSSIndex - 1);
        selectSS();
    });
}

function deDupTests(reports) {
    return _(reports)
        .flatMap(r => r.suites)
        .map(s => {
            // for each suite group tests by name
            // and filter for groups where ALL tests failed (retries all failed)
            return _(s.tests)
                .groupBy(s => s.name)
                .values()
                .filter(tests => {
                    return _.every(tests, t => t.state === 'failed');
                })
                .value();
        })
        .filter(a => a.length > 0)
        .map(a => {
            // the multiple failures are repeats
            // we only need one them
            return a.map(aa => aa[0]);
        })
        .flatMap()
        .value();
}

async function bootstrap() {
    const reportData = await getResultsReport();

    runMode =
        reportData.length && reportData[0]?.specs[0]?.includes('/remote/')
            ? 'remote'
            : 'local';

    console.log('reportData', reportData);

    // Load screenshot URLs
    let screenshotUrls = {};
    try {
        // Use the same path logic as screenshots - on CircleCI artifacts are at ./screenshots/
        const urlsPath = isLocalHost
            ? `./${runMode}/screenshots/screenshot-urls.json`
            : './screenshots/screenshot-urls.json';
        console.log('Fetching screenshot URLs from:', urlsPath);
        const urlsResponse = await fetch(urlsPath);
        if (urlsResponse.ok) {
            screenshotUrls = await urlsResponse.json();
            console.log('Loaded screenshot URLs:', screenshotUrls);
        } else {
            console.log(
                'Screenshot URLs file not found (status:',
                urlsResponse.status,
                ')'
            );
        }
    } catch (e) {
        console.log('Could not load screenshot URLs:', e);
    }

    var tests = _(reportData)
        .flatMap(r => r.suites)
        .flatMap(s => s.tests)
        .value();

    const de = deDupTests(reportData);

    const filteredReportData = de.filter(test => {
        return (
            test.state === 'failed' &&
            /assertScreenShotMatch/i.test(test.standardError)
        );
    });

    //const filteredReportData = reportData[0].suites[0].tests;

    console.log(filteredReportData);

    const data = buildData(filteredReportData, screenshotUrls);

    renderList(data);
}

var selectedSSIndex = 0;
$(document).ready(function() {
    bootstrap();
});

var sideBySideCycleInterval = null;

function buildImagePath(ref, rootUrl) {
    return {
        screenImagePath: `${rootUrl}` + ref.replace(/reference\//, 'screen/'),
        diffImagePath: `${rootUrl}` + ref.replace(/reference\//, 'diff/'),
        refImagePath: `${rootUrl}screenshots/${ref}`,
        imageName: ref.substring(ref.lastIndexOf('/') + 1),
    };
}

function buildCurlStatement(data) {
    // -L means follow redirects
    //      CircleCI seems to be hosting their files differently now, with the real URL
    //      being behind a redirect, and so if we don't use the -L option we end up with a corrupted file.
    //      -L makes curl "follow" the redirect so it downloads the file correctly.

    const imageUrl = window.location.href.replace(
        /imageCompare\.html?/,
        data.screenImagePath
    );

    const imageName = data.imageName;

    return `curl -L '${imageUrl}' > 'end-to-end-test/${runMode}/screenshots/reference/${imageName}'; git add 'end-to-end-test/${runMode}/screenshots/reference/${imageName}';`;
}

function updateSideBySide(opacity) {
    $('#sidebyside div.imgs img.screen')[0].style.opacity = opacity;
}

function clearSideBySideInterval() {
    clearInterval(sideBySideCycleInterval);
    sideBySideCycleInterval = null;
    $('#sidebyside_cycleBtn')[0].style['background-color'] = '#ffffff';
}

function buildDisplay(data, allData, rootUrl) {
    var curlStatements = allData.map(item => {
        var data = buildImagePath(item.refImagePath, rootUrl);
        return buildCurlStatement(data);
    });

    var thisData = buildImagePath(data.refImagePath, rootUrl);

    // Get the URL from the test data if available
    var screenshotUrl =
        data.test && data.test.screenshotUrl ? data.test.screenshotUrl : '';

    var template = `
     <h3 class="screenshot-name"></h3>
        ${
            screenshotUrl
                ? `<p><strong>URL:</strong> <a href="${screenshotUrl}" target="_blank">${screenshotUrl}</a></p>`
                : ''
        }
        <button id="toggleDiffModeBtn" style="font-size:16px">Toggle Comparison Mode</button>
        <br/><br/>
        
        <div id="juxta" class="juxtapose" style="${
            diffSliderMode ? 'display:none' : 'display:block'
        }">
            
        </div>
        
       
        
        <div id="sidebyside" style="position:relative">
             <div>
                <div class="slidecontainer">
                  Reference&nbsp;
                  <input type="range" min="0" max="100" value="50" class="slider" id="opacitySlider">
                  &nbsp;Screen
                  &nbsp;&nbsp;&nbsp;<button id="sidebyside_cycleBtn">Cycle</button>
                </div>
             </div>    
        
            <div style="position:relative" class="imgs">
                <img style="border:1px solid; position:absolute;left:0;top:0;" src="${
                    data.refImagePath
                }"/>
                <img class="screen" style="border:1px solid; position:absolute;left:0;top:0;opacity:0.5;" src="${
                    data.screenImagePath
                }"/>
                ${
                    '' /* the following is done to give this div the correct height, because the sidebyside images cant both be non-absolute positioned */
                }
                <div style="width:1px; overflow:hidden; display:inline-block; opacity:0">
                    <img src="${data.refImagePath}"/>
                </div>
                <div style="width:1px; overflow:hidden; display:inline-block; opacity:0">
                    <img src="${data.screenImagePath}"/>
                </div>
            </div>
        </div>
        
        <h2>Screenshot Diff</h2>
        <h3 class="screenshot-name"></h3>
        <img id="diff" src="${data.diffImagePath}" />
        <h2>Help</h2>
        <p id="help-text">
        When the screenshot test fails, it means that the screenshot taken from
        your instance of the portal differs from the screenshot stored in the
        repo.<br />
        <br />
        1. If the change in the screenshot is <b>undesired</b>, i.e. there is
        regression, you should fix your PR.<br />
        <br />
        2. If the change in the screenshot is <b>desired</b>, add the screenshot
        to the repo, commit it and push it to your PR's branch, that is:
        <br />
        <br />
        <textarea class="curls">${buildCurlStatement(thisData)}</textarea>
        <br />
        <br />
        Then preferably use git commit --amend and change your commit message
        to explain how the commit changed the screenshot. Subsequently force
        push to your <b>own branch</b>.
        
        <br/>
        <h3>Curls for all failing screenshots</h3>
        <textarea class="curls">${curlStatements.join(' ')}</textarea>
        </p>
    `;

    $('#display').html(template);

    $('#opacitySlider').on('input', e => {
        var opacity = e.target.value / 100;
        updateSideBySide(opacity);
    });

    $('#sidebyside_cycleBtn').click(() => {
        if (sideBySideCycleInterval === null) {
            $('#sidebyside_cycleBtn')[0].style['background-color'] = '#dddddd';
            var ascending = true;
            var hiddenSliderValue = parseInt($('#opacitySlider')[0].value, 10); // so as to build in pauses on either end
            sideBySideCycleInterval = setInterval(() => {
                if (hiddenSliderValue >= 150) {
                    ascending = false;
                } else if (hiddenSliderValue <= -50) {
                    ascending = true;
                }
                hiddenSliderValue += ascending ? 5 : -5;
                var newSliderValue = hiddenSliderValue;
                if (newSliderValue > 100) {
                    newSliderValue = 100;
                }
                if (newSliderValue < 0) {
                    newSliderValue = 0;
                }
                $('#opacitySlider')[0].value = newSliderValue.toString();
                updateSideBySide(newSliderValue / 100);
            }, 25);
        } else {
            clearSideBySideInterval();
        }
    });

    var slider = new juxtapose.JXSlider(
        '#juxta',
        [
            {
                src: data.refImagePath,
                label: 'reference',
            },
            {
                src: data.screenImagePath,
                label: 'screen',
            },
        ],
        {
            animate: true,
            showLabels: true,
            startingPosition: '50%',
            makeResponsive: true,
        }
    );
}

function getResultsReport() {
    return $.get(reportUrl);
}

function buildPage() {
    var img1 = getURLParameterByName('img1');
    var img2 = getURLParameterByName('img2');
    var label1 = getURLParameterByName('label1');
    var label2 = getURLParameterByName('label2');
    var screenshotName = getURLParameterByName('screenshot_name');
    var diffImage = getURLParameterByName('diff_img');

    if (img1 !== '' && img2 !== '') {
        $('#img1').attr('src', img1);
        $('#img2').attr('src', img2);
        $('#img2-url').html(img2);

        if (screenshotName !== '') {
            $('.screenshot-name').html(screenshotName);
        }
        if (diffImage !== '') {
            $('#diff').attr('src', diffImage);
        }
    } else {
        $('#help-text').text(
            'Set images to compare in URL e.g. ?img1=http://image1.com&img2=http://image2.com&label1=before&label2=after&screenshot_name=test_screenshot'
        );
    }
}
