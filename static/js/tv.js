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

    document.querySelector('#player1name').innerHTML = `<p><img src="/static/flagsv2/${data.player1.flag}" class="flag"> ${data.player1.shortname}</p>`;
    document.querySelector('#player2name').innerHTML = `<p><img src="/static/flagsv2/${data.player2.flag}" class="flag"> ${data.player2.shortname}</p>`;

    document.querySelector('#player1scoreset1 p').textContent = peek(data.player1.score[0]);
    document.querySelector('#player1scoreset2 p').textContent = peek(data.player1.score[1]);
    document.querySelector('#player1scoreset3 p').textContent = peek(data.player1.score[2]);
    document.querySelector('#player2scoreset1 p').textContent = peek(data.player2.score[0]);
    document.querySelector('#player2scoreset2 p').textContent = peek(data.player2.score[1]);
    document.querySelector('#player2scoreset3 p').textContent = peek(data.player2.score[2]);

    for (let i=1; i<=3; i++) {
        if (i === currentset) {
            document.getElementById('player1scoreset' + i).style.visibility = 'visible';
            document.getElementById('player1scoreset' + i).style.backgroundColor = 'grey';
            document.getElementById('player1scoreset' + i).style.border = '1px solid black';
            document.getElementById('player2scoreset' + i).style.visibility = 'visible';
            document.getElementById('player2scoreset' + i).style.backgroundColor = 'grey';
            document.getElementById('player2scoreset' + i).style.border = '1px solid black';
        } else if (i < currentset) {
            document.getElementById('player1scoreset' + i).style.visibility = 'visible';
            document.getElementById('player1scoreset' + i).style.backgroundColor = 'white';
            document.getElementById('player1scoreset' + i).style.border = '1px solid black';
            document.getElementById('player2scoreset' + i).style.visibility = 'visible';
            document.getElementById('player2scoreset' + i).style.backgroundColor = 'white';
            document.getElementById('player2scoreset' + i).style.border = '1px solid black';
        } else {
            document.getElementById('player1scoreset' + i).style.visibility = 'hidden';
            document.getElementById('player1scoreset' + i).style.backgroundColor = 'rgba(0, 0, 0, 0)';
            document.getElementById('player1scoreset' + i).style.borderColor = 'rgba(0, 0, 0, 0)';
            document.getElementById('player1scoreset' + i).style.borderRadius = '1px';
            document.getElementById('player2scoreset' + i).style.visibility = 'hidden';
            document.getElementById('player2scoreset' + i).style.backgroundColor = 'rgba(0, 0, 0, 0)';
            document.getElementById('player2scoreset' + i).style.borderColor = 'rgba(0, 0, 0, 0)';
            document.getElementById('player2scoreset' + i).style.borderRadius = '1px';
        }
    }

    console.log(lastScorer);
    if (lastScorer === 'player1') {
        document.getElementById("player1serve").querySelector("img").style.visibility = "visible";
        document.getElementById("player1serve").querySelector("img").src = "/static/images/shuttlecock.png";
        document.getElementById("player2serve").querySelector("img").style.visibility = "hidden";
    }
    else if (lastScorer === 'player2') {
        document.getElementById("player1serve").querySelector("img").style.visibility = "hidden";
        document.getElementById("player2serve").querySelector("img").style.visibility = "visible";
        document.getElementById("player2serve").querySelector("img").src = "/static/images/shuttlecock.png";
    } else {
        document.getElementById("player1serve").querySelector("img").style.visibility = "hidden";
        document.getElementById("player2serve").querySelector("img").style.visibility = "hidden";
    }

}

setInterval(loadScores, 500);
loadScores();
