let scores = {};
let lastScorer = null;
let currentset = 0;
let playersSwapped = false;

function peek(obj) {
    return obj[obj.length - 1];
}

function flashScore(player) {
    const el = document.querySelector(`.${player}score`);
    el.classList.remove('flash'); // reset animation
    void el.offsetWidth; // trigger reflow to restart animation
    el.classList.add('flash');
}


async function loadScores() {
    const scoreboardid = document.getElementById("scoreboard_id").textContent
    const res = await fetch('/api/get_scoreboard?id=' + scoreboardid);
    scores = await res.json();
    currentset = scores.current_set;
    lastScorer = peek(scores.last_scorer[currentset]) || null;


    renderScores();
}

function renderScores() {
    currentset = scores.current_set;
    lastScorer = peek(scores.last_scorer[currentset]) || null;
    const player1 = document.querySelector('.player1name');
    const player2 = document.querySelector('.player2name');

    player1.querySelector(".flag").src= `/static/flagsv2/${scores.player1.flag}`;
    player1.querySelector(".countrycode").textContent = scores.player1.countrycode;
    player1.querySelector(".name").textContent = scores.player1.name;
    player1.querySelector(".shuttle").src = `/static/images/shuttlecock.png`;
    document.querySelector(".player1score").textContent = peek(scores.player1.score[currentset]);
    player2.querySelector(".flag").src= `/static/flagsv2/${scores.player2.flag}`;
    player2.querySelector(".countrycode").textContent = scores.player2.countrycode;
    player2.querySelector(".name").textContent = scores.player2.name;
    player2.querySelector(".shuttle").src = `/static/images/shuttlecock.png`;
    document.querySelector(".player2score").textContent = peek(scores.player2.score[currentset]);

    document.querySelector("#currentset").value = currentset;

    const player1serve = document.getElementById('player1serve');
    const player2serve = document.getElementById('player2serve');

    if (lastScorer == 'player1') {
        player1serve.style.visibility = 'visible';
        player2serve.style.visibility = 'hidden';
    }
    else if (lastScorer == 'player2') {
        player1serve.style.visibility = 'hidden';
        player2serve.style.visibility = 'visible';
    } else {
        player1serve.style.visibility = 'hidden';
        player2serve.style.visibility = 'hidden';
    }

    const sets = document.getElementById('sets');
    sets.innerHTML = `Set 1: ${peek(scores.player1.score[0])}-${peek(scores.player2.score[0])} <br>Set 2: ${peek(scores.player1.score[1])}-${peek(scores.player2.score[1])}<br>Set 3: ${peek(scores.player1.score[2])}-${peek(scores.player2.score[2])}`;
}


function swapPlayers() {
    const scoreboard = document.querySelector('.scoreboard');
    const bottomrow = document.querySelector('.bottomrow');

    const p1Name = document.querySelector('.player1name');
    const p1Score = document.querySelector('.player1score');
    const p2Score = document.querySelector('.player2score');
    const p2Name = document.querySelector('.player2name');

    const s1 = document.querySelector('.scoreplayer1');
    const swap = document.querySelector('.swapplayers');
    const s2 = document.querySelector('.scoreplayer2');

    if (!playersSwapped) {
        // Swap in scoreboard
        scoreboard.insertBefore(p1Score, p1Name);
        scoreboard.insertBefore(p2Score, p1Score);
        scoreboard.insertBefore(p2Name, p2Score);

        // Swap in bottom row
        bottomrow.insertBefore(swap, s1);
        bottomrow.insertBefore(s2, swap);

        const sets = document.getElementById('sets');
        sets.innerHTML = `Set 1: ${peek(scores.player2.score[0])}-${peek(scores.player1.score[0])} <br>Set 2: ${peek(scores.player2.score[1])}-${peek(scores.player1.score[1])}<br>Set 3: ${peek(scores.player2.score[2])}-${peek(scores.player1.score[2])}`;
    } else {
        // Swap back
        scoreboard.insertBefore(p2Score, p2Name);
        scoreboard.insertBefore(p1Score, p2Score);
        scoreboard.insertBefore(p1Name, p1Score);

        bottomrow.insertBefore(swap, s2);
        bottomrow.insertBefore(s1, swap);

        const sets = document.getElementById('sets');
        sets.innerHTML = `Set 1: ${peek(scores.player1.score[0])}-${peek(scores.player2.score[0])} <br>Set 2: ${peek(scores.player1.score[1])}-${peek(scores.player2.score[1])}<br>Set 3: ${peek(scores.player1.score[2])}-${peek(scores.player2.score[2])}`;
    }

    playersSwapped = !playersSwapped;
}

async function addPoint(playerwon, playerlost) {
    await loadScores();

    prevscorewon = peek(scores[playerwon].score[currentset]);
    prevscorelost = peek(scores[playerlost].score[currentset]);
    scores[playerwon].score[currentset].push(prevscorewon + 1);
    scores[playerlost].score[currentset].push(prevscorelost);
    scores.last_scorer[currentset].push(playerwon);


    const postscore = {
        "id": scores.id,
        "current_set": scores.current_set,
        "last_scorer": scores.last_scorer,
        "player1_score": scores.player1.score,
        "player2_score": scores.player2.score
    };

    await fetch('/api/update_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postscore)
    });

    flashScore(playerwon);
    await loadScores();
}

async function undoPoint() {
    await loadScores();
    let prevplayer = null;
    
    if (scores.player1.score[currentset].length > 1) {
        scores.player1.score[currentset].pop();
    }
    if (scores.player2.score[currentset].length > 1) {
        scores.player2.score[currentset].pop();
    }
    if (scores.last_scorer[currentset].length > 0) {
        prevplayer = scores.last_scorer[currentset].pop();
    }
    
        

    const postscore = {
        "id": scores.id,
        "current_set": scores.current_set,
        "last_scorer": scores.last_scorer,
        "player1_score": scores.player1.score,
        "player2_score": scores.player2.score
    };

    await fetch('/api/update_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postscore)
    });

    flashScore(prevplayer);
    await loadScores();
}

async function resetScore() {
    if (!confirm("Are you sure you want to reset the score for this set? This action cannot be undone.")) {
        return;
    }

    await loadScores();
    scores['player1'].score[currentset] = [0];
    scores['player2'].score[currentset] = [0];
    scores.last_scorer[currentset] = [];

    

    const postscore = {
        "id": scores.id,
        "current_set": scores.current_set,
        "last_scorer": scores.last_scorer,
        "player1_score": scores.player1.score,
        "player2_score": scores.player2.score
    };

    await fetch('/api/update_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postscore)
    });
    await loadScores();
}

async function resetAllScores() {
    if (!confirm("Are you sure you want to reset all sets? This action cannot be undone.")) {
        return;
    }
    await loadScores();
    scores['player1'].score = [[0], [0], [0]];
    scores['player2'].score = [[0], [0], [0]];
    scores.last_scorer = [[], [], []];
    currentset = 0;
    scores.current_set = currentset;

    

    const postscore = {
        "id": scores.id,
        "current_set": scores.current_set,
        "last_scorer": scores.last_scorer,
        "player1_score": scores.player1.score,
        "player2_score": scores.player2.score
    };

    await fetch('/api/update_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postscore)
    });
    await loadScores();
}

document.getElementById("currentset").addEventListener("change", async function () {
    await updateCurrentSet(this.value);
});

async function updateCurrentSet(value) {
    await loadScores();

    currentset = parseInt(value);
    scores.current_set = currentset;

    const postscore = {
        "id": scores.id,
        "current_set": scores.current_set,
        "last_scorer": scores.last_scorer,
        "player1_score": scores.player1.score,
        "player2_score": scores.player2.score
    };

    await fetch('/api/update_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postscore)
    });

    await loadScores();

}

document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault(); // Optional: prevents default "undo"
      undoPoint();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('buttonplayer1').addEventListener('click', function () {
        addPoint('player1', 'player2');
    });

    document.getElementById('buttonplayer2').addEventListener('click', function () {
        addPoint('player2', 'player1');
    });

    document.querySelector('.swapplayers').addEventListener('click', swapPlayers);

    document.querySelector('.resetbutton').addEventListener('click', resetScore);
    document.querySelector('.resetallbutton').addEventListener('click', resetAllScores);
    document.querySelector('.undo').addEventListener('click', undoPoint);
});

window.onload = loadScores;