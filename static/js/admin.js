let countriesData = {};  // To store the countries data (name, code, and flag)
let scores = {}

async function loadCountries() {
    const response = await fetch('/api/countries');
    countriesData = await response.json();

    const selects = ['player1country', 'player2country'];

    for (let id of selects) {
        const select = document.getElementById(id);
        select.innerHTML = '';

        for (let country in countriesData) {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country + " (" + countriesData[country][1] + ")";  // Display country name and code
            select.appendChild(option);
        }

        // Init Select2
        $(`#${id}`).select2({
            placeholder: "Select a country",
            templateResult: formatCountryOption,
            templateSelection: formatCountryOption,
            minimumResultsForSearch: 1,
            width: '100%'
        });

        // Listen for Select2 changes
        $(`#${id}`).on('select2:select', function (e) {
            const countryName = e.params.data.id;
            updateCountryDetails(id.replace('country', ''), countryName, true);  // previewOnly = true
        });
        
    }
}


function formatCountryOption(option) {
    if (!option.id) return option.text;

    const flag = countriesData[option.id]?.[0];
    if (!flag) return option.text;

    const flagUrl = `/static/flagsv2/${flag}`;
    return $(`<span><img src="${flagUrl}" class="flag-icon"> ${option.text}</span>`);
}


function updateCountryDetails(player, countryName, previewOnly = false) {
    const countryData = countriesData[countryName];
    if (countryData) {
        const flag = countryData[0];
        const code = countryData[1];

        // Always update the visible flag preview
        document.querySelector(`#${player}flag`).src = `/static/flagsv2/${flag}`;

        // Only update the hidden input if this is not a preview
        if (!previewOnly) {
            document.querySelector(`#${player}countrycode`).value = code;
        }
    }
}


async function loadScores() {
    const scoreboardid = document.getElementById("scoreboard_id").textContent
    const res = await fetch('/api/get_scoreboard?id=' + scoreboardid);
    const data = await res.json();

    scores = data;

    // Player 1
    document.querySelector('#player1name').value = data.player1.name;
    document.querySelector('#player1short').value = data.player1.shortname;
    $('#player1country').val(data.player1.country).trigger('change');
    updateCountryDetails('player1', data.player1.country);

    // Player 2
    document.querySelector('#player2name').value = data.player2.name;
    document.querySelector('#player2short').value = data.player2.shortname;
    $('#player2country').val(data.player2.country).trigger('change');
    updateCountryDetails('player2', data.player2.country);
    
}

document.getElementById('adminForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const player1name = document.querySelector('#player1name').value;
    const player1country = document.querySelector('#player1country').value;

    const player2name = document.querySelector('#player2name').value;
    const player2country = document.querySelector('#player2country').value;

    scores['player1'].name = player1name;
    scores['player1'].country = player1country;

    scores['player2'].name = player2name;
    scores['player2'].country = player2country;

    scores['player1'].countrycode = countriesData[player1country][1];
    scores['player2'].countrycode = countriesData[player2country][1];

    scores['player1'].flag = countriesData[player1country][0];
    scores['player2'].flag = countriesData[player2country][0];

    scores['player1'].shortname = document.querySelector('#player1short').value;
    scores['player2'].shortname = document.querySelector('#player2short').value;

    if (scores['player1'].shortname === "") {
        scores['player1'].shortname = scores['player1'].name;
    }
    if (scores['player2'].shortname === "") {
        scores['player2'].shortname = scores['player2'].name;
    }

    
    const postnames = {
        "id": scores.id,
        "player1_name": scores.player1.name,
        "player1_country": scores.player1.country,
        "player1_countrycode": scores.player1.countrycode,
        "player1_flag": scores.player1.flag,
        "player1_shortname": scores.player1.shortname,
        "player2_name": scores.player2.name,
        "player2_country": scores.player2.country,
        "player2_countrycode": scores.player2.countrycode,
        "player2_flag": scores.player2.flag,
        "player2_shortname": scores.player2.shortname
    };

    await fetch('/api/update_names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postnames)
    });

    location.reload();  
});

document.getElementById('refresh-button').addEventListener('click', function (event) {
    event.preventDefault();
    location.reload();  // This reloads the full page
});


(async () => {
    await loadCountries();
    await loadScores();
})();
