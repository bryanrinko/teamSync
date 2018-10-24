const ical = require('node-ical');
let ts_utils = require('./teamsnapUtils');

//Utility functions to  handle ical data

global.RO = true

global.icals = [];

global.mstrIcals=[];
global.league1Icals=[];
global.league2Icals=[];

global.addGames = [];
global.changedGames = [];
global.status='';

global.me
global.myTeam
global.myOpponents = []
global.myLocations = []
global.myGames = []

module.exports = {
    launchSync: async function (commiss_master_url,league1_master_url,league2_master_url,teamsnap_url) {
        let fetchCommissMasterPromise
        let fetchLeague1MasterPromise
        let fetchLeague2MasterPromise

        if (commiss_master_url) fetchCommissMasterPromise = await  fetchCommissMasterIcal(commiss_master_url)
        if (league1_master_url) fetchLeague1MasterPromise = await  fetchLeague1MasterIcal(league1_master_url)    
        if (league2_master_url) fetchLeague2MasterPromise = await  fetchLeague2MasterIcal(league2_master_url)
            //combine ical[0] and ical[1]
            //dealing with trying to combine 2 master icals, originally built for one master and one replica
            //let tempIcal = icals[0].concat(league1Icals,league2Icals)
            //icals = []
            //icals.push(tempIcal)
        
        //let fetchTeamsnapPromise = await  fetchTeamsnapIcal(teamsnap_url)

        fixMasterLabels(mstrIcals,league1Icals,league2Icals)

        let fetchMePromise = await  ts_utils.getMePromise()
        let fetchTeamPromise = await ts_utils.getTeamPromise(me,tsTargetTeam)
        let fetchOpponentsPromise = await  ts_utils.getTeamOpponentsPromise(myTeam)
        let fetchLocationsPromise = await  ts_utils.getTeamLocationsPromise(myTeam)
        let fetchGamesPromise = await  ts_utils.getTeamGamesPromise(myTeam)

        compareMasterToTeamsnap(mstrIcals,myGames)

        //live check of teamsnap data
        //TBD....can i also do live check of sportsengine
        let newGames = createNewGames(mstrIcals,myGames)                                //Games in the org master schedule but not in teamsnap
        let canceledGames = updateCanceledGames(mstrIcals,league1Icals,league2Icals,myGames)   //Games in teamsnap, but not in org master schedule or league schedules.  These should only be canceled in Teamsnap
        let updatedGames = updateChangedGames(mstrIcals,league1Icals,league2Icals,myGames)   //Games in teamsnap, but validate label/league origin, location, date/time.  If UID is not set, set it.
/*
        if (newGames.length>0){
            const bulkTemplatePrefix = '{"templates":['
            const bulkTemplateSuffix = '}'
            let newGameJson = ''
            for (let newGame of newGames){
                let data = ts_utils.mapToNewEvent(newGame,myTeam)
                console.log('Create game:', data.opponent_id,'-',data.location_id,'-',data.start_date,'-',data.is_tbd,'-',data.label,'-',data.game_type)
                let gameNameValuePairs = JSON.stringify(data)
                if (newGameJson.length>0){
                    newGameJson = newGameJson.concat(',')
                }
                newGameJson = newGameJson.concat(gameNameValuePairs)
            }
            let finalGameJson = ''.concat(bulkTemplatePrefix,newGameJson,'],"team_id":',myTeam.id,',"notifyTeam":false',bulkTemplateSuffix)
            if (!RO) {
                //console.log(finalGameJson)
                let fetchCreateBulkGamePromise = await createBulkGamePromise(finalGameJson,myTeam.createBulkEventURL)
            }
        }
*/
        //syncIcal()
        //addGames = icals[0]
        
/*
        if (addGames.length>0){
            const bulkTemplatePrefix = '{"templates":['
            const bulkTemplateSuffix = '}'
            let newGameJson = ''
            for (let game of addGames){
                //do this again....we checked icals...but they can be out of date....this is live
                if (!ts_utils.gameExistInTeamsnap(game,myGames) && !ts_utils.excludeGame(game)){
                    let data = ts_utils.mapToNewEvent(game,myTeam)
                    console.log('Create game:', data.opponent_id,'-',data.location_id,'-',data.start_date,'-',data.is_tbd,'-',data.label,'-',data.game_type)
                    let gameNameValuePairs = JSON.stringify(data)
                    if (newGameJson.length>0){
                        newGameJson = newGameJson.concat(',')
                    }
                    newGameJson = newGameJson.concat(gameNameValuePairs)
                }
            }
            let finalGameJson = ''.concat(bulkTemplatePrefix,newGameJson,'],"team_id":',myTeam.id,',"notifyTeam":false',bulkTemplateSuffix)
            //console.log(finalGameJson)
            //let fetchCreateBulkGamePromise = await createBulkGamePromise(finalGameJson,myTeam.createBulkEventURL)
        }
        if (changedGames.length>0){
            for (let game of changedGames){
                console.log("Update :",game.awayTeam,'at',game.homeTeam,'on',game.date,'(',game.UID,')')
            }
        }

        if (status.length === 0){
            console.log('Looks like everything is up to date')
        }
*/
    } 
};

function compareMasterToTeamsnap(seMaster,tsGames){
    console.log('Master ical Schedule Game Count:',seMaster.length)
    console.log('Teamsnap Schedule Game Count:',tsGames.length)
    let newGames = []
    for (let mstrGame of seMaster){
        let matchedGame = ts_utils.gameExistsInTeamsnap(mstrGame,tsGames)
        if (matchedGame){
            newGames.push(mstrGame)
        }
    }
    console.log('Matched Schedule Game Count:',newGames.length)
    if(seMaster.length===tsGames.length===newGames.length) console.log('You are synced')
}

function fetchCommissMasterIcal(ical_url) {
    return new Promise(resolve => {
        ical.fromURL(ical_url, {}, function(err, data) {
            if (err){
                reject(err);
            } else {
                //mstrIcals.push(processCal(data,ical_url));
                mstrIcals=processCal(data,ical_url);
                resolve(mstrIcals);
            }
        })
    });
}

function fetchLeague1MasterIcal(ical_url) {
    return new Promise(resolve => {
        ical.fromURL(ical_url, {}, function(err, data) {
            if (err){
                reject(err);
            } else {
                //league1Icals.push(processCal(data,ical_url));
                league1Icals=processCal(data,ical_url);
                resolve(league1Icals);
            }
        })
    });
}

function fetchLeague2MasterIcal(ical_url) {
    return new Promise(resolve => {
        ical.fromURL(ical_url, {}, function(err, data) {
            if (err){
                reject(err);
            } else {
                league2Icals.push(processCal(data,ical_url));
                league2Icals=processCal(data,ical_url);
                resolve(league2Icals);
            }
        })
    });
}

function fetchTeamsnapIcal(ical_url) {
    return new Promise(resolve => {
        ical.fromURL(ical_url, {}, function(err, data) {
            if (err){
                reject(err);
            } else {
                icals.push(processCal(data,ical_url));
                resolve(icals);
            }
        })
    });
}

async function createNewGames(seMaster, tsGames){
    let newGames = []
    for (let mstrGame of seMaster){
        //let gameMatch = false
        let matchedGame = ts_utils.gameExistsInTeamsnap(mstrGame,tsGames)
        if (!matchedGame){
            newGames.push(mstrGame)
        }
    }
    if (newGames.length>0){
        const bulkTemplatePrefix = '{"templates":['
        const bulkTemplateSuffix = '}'
        let newGameJson = ''
        for (let newGame of newGames){
            //creates dependent objects (if missing) in Teamsnap so we can successfully create a game
            if (ts_utils.createOpponentAndOrLocation(newGame)){
                //reload collections since we created some dependents
                let fetchOpponentsPromise = await  ts_utils.getTeamOpponentsPromise(myTeam)
                let fetchLocationsPromise = await  ts_utils.getTeamLocationsPromise(myTeam)
            }

            let data = ts_utils.mapToNewEvent(newGame,myTeam)
            console.log('Create game:', data.opponent_id,'-',data.location_id,'-',data.start_date,'-',data.is_tbd,'-',data.label,'-',data.game_type)
            let gameNameValuePairs = JSON.stringify(data)
            if (newGameJson.length>0){
                newGameJson = newGameJson.concat(',')
            }
            newGameJson = newGameJson.concat(gameNameValuePairs)
        }
        let finalGameJson = ''.concat(bulkTemplatePrefix,newGameJson,'],"team_id":',myTeam.id,',"notifyTeam":false',bulkTemplateSuffix)
        if (!RO) {
            //console.log(finalGameJson)
            let fetchCreateBulkGamePromise = await ts_utils.createBulkGamePromise(finalGameJson,myTeam.createBulkEventURL)
        }
    }
    return newGames
}

function fixMasterLabels(seMaster, seLeague1, seLeague2){
    for (let mstrGame of seMaster){
        if (mstrGame.label === ''){
            //console.log('MSTR',mstrGame.location,mstrGame.rawStart.toString())
            //let's check SHL/league2 first
            for (let league2Game of seLeague2){
                //console.log("SHL",league2Game.location,league2Game.rawStart.toString())
                if ((league2Game.UID === mstrGame.UID) || 
                        (league2Game.location===mstrGame.location && 
                            league2Game.rawStart.toString()===mstrGame.rawStart.toString())){
                    mstrGame.label = LEAGUE2_LABEL
                    mstrGame.icon_color = LEAGUE2_ICON_COLOR
                    //console.log('found one for SHL')
                    break
                }
            }
        }
    } 
}

//primary method to determine games to add
//teamsnap should reflect the Master Schedule and be confirmed with the league schedules
function getNewGames(seMaster, tsGames){
    let newGames = []
    for (let mstrGame of seMaster){
        //let gameMatch = false
        let matchedGame = ts_utils.gameExistsInTeamsnap(mstrGame,tsGames)
        if (!matchedGame){
            newGames.push(mstrGame)
        }
/*
        matchedGame = ts_utils.gameUIDInTeamsnap(mstrGame,tsGames)
        if (matchedGame){
            gameMatch = true
        }
        if (!gameMatch){
            //OK...not found based on UID....lets try based on opponent/location/date/time
            matchedGame = ts_utils.gameDetailsInTeamsnap(mstrGame,tsGames)
            if (matchedGame){ 
                gameMatch = true
                //need to update game to include UID from master
                let newNote = ''.concat('notes=',matchedGame.notes,' UID:',mstrGame.UID)
                if (!RO) {
                    //console.log('Update note',newNote)
                    let updateGameUidPromise = await updateGameUid(newNote.trim(),matchedGame.href)
                }
            }
        }

        if (!gameMatch) {
            newGames.push(mstrGame)
        }
*/
    }
    return newGames
}

//updates based on league calendars
async function updateChangedGames(seMaster, sePrimaryLeague, seSecondaryLeague, tsGames){
    //Games in teamsnap, but validate label/league origin, location, date/time.  If UID is not set, set it.
    for (let tsGame of tsGames){
        if (!tsGame.notes.indexOf('UID')>0){
            //set UID from master
        }
        if (tsGame.label===''){
            //set label
        }

    }
}

//games not in the mstrCal (probably shouldn't have these as I'd expect them to be cancelled (so updates)
async function updateCanceledGames(seMaster, sePrimaryLeague, seSecondaryLeague, tsGames){
    //is_canceled
}

function syncIcal() {
    let masterIcal = icals[0]
    let replicaIcal = icals[1]

    for (let game of masterIcal){
        let mHash = game.UID
        let found = false
        let changed = false
        for (let tempGame of replicaIcal){
            let rHash = extractUid(tempGame.description)  
            if (mHash === rHash){
                found = true
                if (gamesChanged(game,tempGame)){
                    changed = true
                }
                break
            }
        }

        if (!found){
            addGames.push(game)
        }
        if (changed){
            changedGames.push(game)
        }
    }
    if (addGames.length !== 0){
        status += addGames.length + ' games need to be added to TeamsSnap.  Is that correct?'
    }
    if (changedGames.length !== 0){
        status += changedGames.length + ' games need to be updated in TeamsSnap.  Is that correct?'
    }
}

//Function that builds an array of games by facilitating each event from the ical to the game object...and sorts the array
function processCal(data,ical_url){
    let result = [];
    for (let k in data){
        let game;
        if (data.hasOwnProperty(k)) {
            let ev = data[k];
            if (ev.summary){
                game = processEvent(ev,ical_url);
                if (game){
                    result.push(game);
                }
            }
        }
    }
    result.sort(gameSortCompare);
    return result;
}

//Map event to game object
function processEvent(event,ical_url){
    //console.log(event)
    if (event.summary.includes('vs') || event.summary.includes('at')){
        let game =  new Object();
        game.description = event.description;
        game.raw = event;
        game.rawStart = event.start
        game.source = getSource(ical_url);
        if (game.source === TEAMSNAP_ICAL_DOMAIN){
            game.UID = extractUid(event.description)
        }else{
            game.UID = event.uid;
        }
        game = determineIconColorAndLabel(game);
        game = determineHomeAway(event,game);
        game = extractLocation(event,game);
        game = extractDate(event,game);
        game = extractStartTime(event,game);
        game = extractOpponent(game);  

        return game;
    }
}

//Logic to determine if a match is found in the replica, but the data is meanigfully different
function gamesChanged(masterGame, replicaGame){
    return false;
}

//Logic to sort the array to efficiently discover games in the replica
//A map would be better if we use the UID
function gameSortCompare(a,b){
    //sort by  date time combo
    if (a.date.toString().concat(a.start.toString()) < b.date.toString().concat(b.start.toString()))
        return -1;
    if (a.date.toString().concat(a.start.toString()) > b.date.toString().concat(b.start.toString()))
        return 1;
    return 0;
}

//Get the domain of the source
function getSource(url){
    let parsedURL = url.split('.');
    return parsedURL[1];
}

function determineIconColorAndLabel(game){
    //call order matters 
    game = determineLabel(game)
    game = determineIconColor(game)
    
    return game
}

function determineLabel(game){
    if (game.description.includes('Scrimmage') || game.description.includes('scrimmage') || game.description.includes('non-league')){
        game.label = SCRIMMAGE_LABEL
    }else if ((game.source === LEAGUE1_ICAL_DOMAIN) || (game.description.includes(LEAGUE1_SIGNATURE))){
        game.label = LEAGUE1_LABEL
    }else if ((game.source === LEAGUE2_ICAL_DOMAIN) || (game.description.includes(LEAGUE2_SIGNATURE))){
        game.label = LEAGUE2_LABEL
    }else{
        game.label = ''
    }
    return game;
}

function determineIconColor(game){
    if (game.label === LEAGUE1_LABEL){
        game.icon_color = LEAGUE1_ICON_COLOR
    }else if (game.label === LEAGUE2_LABEL){
        game.icon_color = LEAGUE2_ICON_COLOR
    }else if (game.label === SCRIMMAGE_LABEL){
        game.icon_color = MASTER_COMMISS_ICON_COLOR
    }else game.icon_color = "green"
    return game;
}

//Figure out which team you are playing
//Probably should normalize
function extractOpponent(game){
    if (game.homeTeam.includes('Oyster River') || game.homeTeam.includes('ORYA') || game.homeTeam.includes(tsTargetTeam)) {
        game.opponent = game.awayTeam.trim();
        game.type = HOME_GAME_TYPE
        game.type_code = HOME_GAME_TYPE_CODE
    }else{
        game.opponent = game.homeTeam.trim();
        game.type = AWAY_GAME_TYPE
        game.type_code = AWAY_GAME_TYPE_CODE
    }

    return game;
}

//Figure out where the game is being played
function extractLocation(event,game){
    game.location = event.location;
    return game;
}

//Capture the unique id provided by the source feed
function extractUid(description){
    let descPieces = description.split('\n')
    //console.log(descPieces.length)
    //let descPieces = "Location: Churchill Rink at Jacksons Landing\n UID:event_427758495_ngin.com - \n Uniform: White (Arrival Time:  9:40 AM (Eastern Time (US & Canada)))".split('\n')
    if (descPieces.length>0){
        for (let str of descPieces){
            if (str.indexOf('UID:')>0){
                let trimmedstr = str.trim()
                let uid = trimmedstr.substr(4,trimmedstr.indexOf(' ')-4)
                return uid;
                break
            }
        }
    } 
}

//Extract and format the data (support sort)
function extractDate(event,game){
    game.date = event.start.getFullYear().toString().concat((event.start.getMonth()+1).toString().padStart(2,0),event.start.getDate().toString().padStart(2,0));
    return game;
}

//Extract and format the time to 24 hour clock (support sort)
function extractStartTime(event,game){
    game.start = event.start.getHours().toString().padStart(2,0).concat(event.start.getMinutes().toString().padStart(2,0));
    return game;
}

//Parse teams into proper home and away based on at/vs
function determineHomeAway(event,game){
    let teams = event.summary.split('at');
    if (teams.length !== 2){
        teams = event.summary.split('vs');
    }
    game.homeTeam = teams[1];
    game.awayTeam = teams[0];

    return game;
}
