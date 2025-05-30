let prev_scores = {};
let currentset = 0;

function peek(obj) {
    return obj[obj.length - 1];
}


async function loadScores() {
    const scoreboardid = document.getElementById("scoreboard_id").textContent
    const res = await fetch('/api/get_scoreboard?id=' + scoreboardid);
    const data = await res.json();

    if (data == prev_scores) {
        return;
    }
    prev_scores = data;

    currentset = data.current_set;

    document.querySelector('#player1score p').textContent = peek(data.player1.score[currentset]);
    document.querySelector('#player2score p').textContent = peek(data.player2.score[currentset]);

    document.querySelector('#player1name').innerHTML = `<p><img src="/static/flagsv2/${data.player1.flag}" class="flag"><span class="countrycode">${data.player1.countrycode}</span> ${data.player1.name}</p>`;
    document.querySelector('#player2name').innerHTML = `<p><img src="/static/flagsv2/${data.player2.flag}" class="flag"><span class="countrycode">${data.player2.countrycode}</span> ${data.player2.name}</p>`;

    const p1score = document.getElementById('player1score');
    const p2score = document.getElementById('player2score');
    
    const p1set = document.getElementById('player1set');
    const p2set = document.getElementById('player2set');

    lastScorer = peek(data.last_scorer[currentset]);

    if (lastScorer === 'player1') {
        p1score.style.backgroundColor = 'rgb(222, 139, 51)';
        p1score.style.color = 'black';

        p1set.style.backgroundColor = 'rgba(222, 139, 51, 0.80)';

        p2score.style.backgroundColor = 'black';
        p2score.style.color = 'rgb(118, 199, 60)';

        p2set.style.backgroundColor = 'black';
    } else if (lastScorer === 'player2') {
        p2score.style.backgroundColor = 'rgb(118, 199, 60)';
        p2score.style.color = 'black';

        p2set.style.backgroundColor = 'rgba(118, 199, 60, 0.80)';

        p1score.style.backgroundColor = 'black';
        p1score.style.color = 'rgb(222, 139, 51)';

        p1set.style.backgroundColor = 'black';
    } else {
        p2score.style.backgroundColor = 'black';
        p2score.style.color = 'rgb(118, 199, 60)';

        p2set.style.backgroundColor = 'black';

        p1score.style.backgroundColor = 'black';
        p1score.style.color = 'rgb(222, 139, 51)';

        p1set.style.backgroundColor = 'black';
    }

    if (currentset == 0) {
        p1set.style.visibility = "hidden";
        p2set.style.visibility = "hidden";
    } else {
        p1set.style.visibility = "visible";
        p2set.style.visibility = "visible";
    }

    let p1wins = 0;
    let p2wins = 0;

    for (let i=0; i < currentset; i++) {
        if (peek(data.player1.score[i]) > peek(data.player2.score[i])) {
            p1wins += 1;
        }
        if (peek(data.player2.score[i]) > peek(data.player1.score[i])) {
            p2wins += 1;
        }
    }

    p1set.innerHTML = `<p>${p1wins}</p>`;
    p2set.innerHTML = `<p>${p2wins}</p>`;

    console.log(p1wins);
}

setInterval(loadScores, 500);
loadScores();
