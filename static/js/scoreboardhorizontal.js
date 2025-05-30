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

    const p1s = document.getElementById('player1score');
    const p2s = document.getElementById('player2score');

    lastScorer = peek(data.last_scorer[currentset]);

    if (lastScorer === 'player1') {
        p1s.style.backgroundColor = 'rgb(222, 139, 51)';
        p1s.style.color = 'black';

        p2s.style.backgroundColor = 'black';
        p2s.style.color = 'rgb(118, 199, 60)';
    } else if (lastScorer === 'player2') {
        p2s.style.backgroundColor = 'rgb(118, 199, 60)';
        p2s.style.color = 'black';

        p1s.style.backgroundColor = 'black';
        p1s.style.color = 'rgb(222, 139, 51)';
    } else {
        p1s.style.backgroundColor = 'black';
        p1s.style.color = 'rgb(222, 139, 51)';

        p2s.style.backgroundColor = 'black';
        p2s.style.color = 'rgb(118, 199, 60)';
    }
}

setInterval(loadScores, 500);
loadScores();
