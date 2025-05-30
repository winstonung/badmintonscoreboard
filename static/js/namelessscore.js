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
    
    currentset = parseInt(data.current_set)+1;

    lastScorer = peek(data.last_scorer[currentset-1]);
    console.log(data.last_scorer[currentset-1]);


    document.querySelector('#player1scoreset1 p').textContent = peek(data.player1.score[0]);
    document.querySelector('#player1scoreset2 p').textContent = peek(data.player1.score[1]);
    document.querySelector('#player1scoreset3 p').textContent = peek(data.player1.score[2]);
    document.querySelector('#player2scoreset1 p').textContent = peek(data.player2.score[0]);
    document.querySelector('#player2scoreset2 p').textContent = peek(data.player2.score[1]);
    document.querySelector('#player2scoreset3 p').textContent = peek(data.player2.score[2]);

    const p1s = document.getElementById('player1scoreset' + currentset);
    const p2s = document.getElementById('player2scoreset' + currentset);

    for (let i=1; i<=3; i++) {
        if (i <= currentset) {
            document.getElementById('player1scoreset' + i).style.visibility = 'visible';
            document.getElementById('player2scoreset' + i).style.visibility = 'visible';
            document.getElementById('player1scoreset' + i).style.backgroundColor = 'black';
            document.getElementById('player2scoreset' + i).style.backgroundColor = 'black';
            document.getElementById('player1scoreset' + i).style.color = 'rgb(222, 139, 51)';
            document.getElementById('player2scoreset' + i).style.color = 'rgb(118, 199, 60)';
        } else {
            document.getElementById('player1scoreset' + i).style.visibility = 'hidden';
            document.getElementById('player2scoreset' + i).style.visibility = 'hidden';
        }
    }

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
        p2s.style.backgroundColor = 'black';
        p2s.style.color = 'rgb(118, 199, 60)';

        p1s.style.backgroundColor = 'black';
        p1s.style.color = 'rgb(222, 139, 51)';
    }
}

setInterval(loadScores, 500);
loadScores();
