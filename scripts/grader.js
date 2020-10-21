const classErrMessage = 'There is no autograder for this class';
const hwErrMessage = 'There is no autograder for this homework';
const compilerErrMessage = 'Your code resulted in an error and could not be graded';
const timeErrMessage = 'Your code took too long to run. Please check for infinite loops';
const hwButtonClass = 'mdl-button mdl-js-button mdl-button--raised';

(() => {
    console.log(`
Hello! Curious about how this website works?
I run a weekly Web Design Club for high schoolers -- if you're interested, let me know!
            __
        ___( o)>
        \\ <_. )
~~~~~~~~~\`---'~~~~~~~~~
    
~ Christina
        `);

    const HW = [5, 4, 3];     // update with new homeworks

    var dialog = document.querySelector('dialog');
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    dialog.querySelector('.close').addEventListener('click', function() {
      dialog.close();
    });
    $('#file-btn').hide();
    $('#file-btn-disabled').hide();
    $('#loading').hide();
    $('#score').hide();
    let urlParser = new URLSearchParams(window.location.search);
    let hwNum = urlParser.get('hw');
    if (hwNum && HW.indexOf(parseInt(hwNum)) != -1) {
        grader(`hw${hwNum}`);
    } else {
        window.history.replaceState('', '', `/grader.html`);
    }
    $('#course').html('Python');
    let assignments = '<div style="height: 25px;"></div>';
    for (let hw of HW) {
        assignments += `<button onclick="grader('hw${hw}')" class="${hwButtonClass}">Homework ${hw}</button>`;
    }
    $('#assignments').html(assignments);
})();

function grader(hw) {
    window.history.pushState('', '', `/grader.html?hw=${hw.slice(2)}`);

    $('#assignments').hide();
    $('#file-btn').show();
    $('#instructions').html(`Before uploading, make sure to double check that your code will not result in any infinite loops.
                             If your code seems to be taking a long time to run, close this tab, fix your code, and submit again.`);
    $('#assignment').html(`Homework ${hw.slice(2)}`);
    document.getElementById('inputfile')
    .addEventListener('change', function () {
        var fr = new FileReader();
        fr.onload = function () {
            $('#loading').show();
            grade(fr.result, hw);
        }
        fr.readAsText(this.files[0]);
    });
}

function grade(code, hw) {
    let fullPoints = {};
    let results = (scores, cases) => {
        $('#file-btn').hide();
        $('#file-btn-disabled').show();
        $('#loading').hide();
        let display = ``;
        for (const num in scores) {
            let color = "red";
            if (scores[num] == fullPoints[num]) {
                color = "green";
            }
            display += `<div style="color: ${color};">Problem ${num}: ${scores[num]}/${fullPoints[num]} test case${fullPoints[num] == 1 ? '' : 's'}</div>`;
            display += `<div style="margin-left: 25px; margin-bottom: 50px;">`;
            let i = 1;
            for (const c in cases[num]) {
                if (cases[num][c]) {
                    display += `<div>Case ${i} passed!</div>`;
                } else {
                    display += `<div>Case ${i} failed with input: ${c}</div>`;
                }
                i++;
            }
            display += `</div>`;
        }
        $('#score').html(display);
        $('#score').show();
    }
    fullPoints = {};
    
    let data = {};
    data['hw'] = hw;
    $.ajax({
        url: 'https://script.google.com/macros/s/AKfycbxm-nAHBig--apdCLtHXgITSHANco06A4X8CPg7oWsGtadT4xs/exec',
        method: "GET",
        dataType: "json",
        data: data,
        success: function (o) {
            if (o.result == 'success') {
                let callback = results;
                o.cases.forEach((x, i) => {
                    i++;
                    fullPoints[i] = 0;
                    for (const c of x) {
                        if (c[0] == '') break;
                        fullPoints[i]++;
                        let prev = callback;
                        callback = (scores, cases) => {
                            run(code, c[0], c[1], scores, i, prev, hw, cases);
                        }
                    }
                });
                callback({}, []);
            } else {
                dialog(hwErrMessage);
            }
        }
    });
}

function run(code, call, expected, scores, num, callback, hw, cases) {
    pypyjs.exec(
        code + `result = prob_${num}("${call}")`
    ).then(function () {
        return pypyjs.get('result');
    }).then(function (result) {
        let correct = result === expected || result.toString() === expected;
        if (hw == 'hw3' && num == 2) {
            let resultMinCount = call.match(result.split(' ')[0]);
            let expectedMinCount = call.match(expected.split(' ')[0]);
            let resultMaxCount = call.match(result.split(' ')[1]);
            let expectedMaxCount = call.match(expected.split(' ')[1]);
            correct = correct || (resultMinCount == expectedMinCount && resultMaxCount == expectedMaxCount);
        }
        if (scores[num]) {
            scores[num] += (correct ? 1 : 0);
        } else {
            scores[num] = (correct ? 1 : 0);
        }
        if (!cases[num]) cases[num] = {};
        cases[num][call] = correct;
        callback(scores, cases);
    }).catch(err => {
        $('#loading').hide();
        console.log(err);
        dialog(compilerErrMessage);
    });
}


function floatEqual(a, b) {
    if (typeof a == 'number' && typeof b == 'number') return Math.abs(a - b) <= 0.0001;
    return false;
}

function check(form) {
    const user = form.user.value;
    const pass = form.pass.value;

    if (user == 'test' && pass == 'hi') {
        login(user, pass);
    }
}

function login(user, pass) {
    document.getElementById('login').style = 'visibility: hidden';
    document.getElementById('welcome').innerHTML = 'Welcome ' + user;
}

function dialog(message) {
    $('.mdl-dialog__title').html(message);
    var dialog = document.querySelector('dialog');
    dialog.showModal();
}

function done() {
    $('#file-btn').hide();
    $('#file-btn-disabled').show();
}
