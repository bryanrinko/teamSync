const axios = require('axios');

//Teamsnap Utils

//Public Methods
module.exports = {
    getMePromise: function () {
        return new Promise(resolve => {
            axios.get('https://api.teamsnap.com/v3/me', 
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                let itemsCollection = response.data['collection']['items']
                me = getMe(itemsCollection)
                resolve(me)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed 
            });
        });
    },

    getTeamPromise: function (me,aTeamName) {
        return new Promise(resolve => {
            axios.get(me.teamsURL, 
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                let itemsCollection = response.data['collection']['items']
                let mapItem = response.data['collection']
                let myTeams = getTeams(itemsCollection)
                myTeam = getNameFromCollection(myTeams,aTeamName)
                //console.log(getRelLink(mapItem.links,"opponents"),getRelLink(mapItem.links,"locations"))
                myTeam.createOpponentsURL = getRelLink(mapItem.links,"opponents")
                myTeam.createLocationsURL = getRelLink(mapItem.links,"locations")
                resolve(myTeam)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed 
            });
        });
    },

    getTeamOpponentsPromise: function (myTeam) {
        return new Promise(resolve => {
            axios.get(myTeam.opponentsURL, 
                    {
                        headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                    }
                )
                .then(function (response) {
                    let itemsCollection = response.data['collection']['items']
                    myOpponents = getOpponents(itemsCollection)
                    resolve(myOpponents)
                })
                .catch(function (error) {
                    console.log(error);
                })
                .then(function () {
                    // always executed
            });
        });
    },

    getTeamLocationsPromise: function (myTeam) {
        return new Promise(resolve => {
            axios.get(myTeam.locationsURL, 
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                let itemsCollection = response.data['collection']['items']
                myLocations = getLocations(itemsCollection)
                resolve(myLocations)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        });
    },

    getTeamGamesPromise: function (myTeam) {
        return new Promise(resolve => {
            axios.get(myTeam.eventsURL, 
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                myTeam.createEventURL = response.data['collection'].href //Need this to create new events
                let itemsCollection = response.data['collection']['items']
                let cmdscollection = response.data['collection']['commands']
                myTeam.createBulkEventURL = getRelLink(cmdscollection,'bulk_create') //https://api.teamsnap.com/v3/bulk_load'
                myGames = getGames(itemsCollection)
                resolve(myGames)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        });
    },

    createBulkGamePromise: function (data,url) {
        return new Promise(resolve => {
            axios.post(url, data,
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                console.log(response.data)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        });
    },

    updateGameUid: function (data,url) {
        return new Promise(resolve => {
            axios.patch(url, ''.concat("'",data,"'"),
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                console.log(response.data)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        });
    },

    mapToNewEvent: function (game,myTeam){
        let opponent = getNameFromCollection(myOpponents,game.opponent)
        let location = getNameFromCollection(myLocations,game.location)

        let newEvent = getDefaultGame()
        newEvent.team_id = myTeam.id
        newEvent.location_id = location.id
        newEvent.opponent_id = opponent.id
        newEvent.notes = newEvent.notes + game.UID
        newEvent.game_type = game.type
        newEvent.game_type_code = game.type_code
        newEvent.icon_color = game.icon_color
        newEvent.label = game.label
        newEvent.start_date = formatDateForTeamsnap(game)
        if (game.start === '0000') 
            newEvent.is_tbd = true
        else
            newEvent.is_tbd = false

        return newEvent
    },

    excludeGame: function (game){
        let exclude = false
        //if(game.start === '0000'){
        //    exclude = true
        //}
        return exclude
    },

    gameUIDInTeamsnap: function (game,existingGames){
        let gameFound

        //loop through existing games in TS and see if we find it.
        for (let existingGame of existingGames){
            //Check ONE ... most accurate
            if (game.UID === existingGame.uid){
                gameFound = existingGame
                //console.log('gameUIDInTeamsnap:', existingGame.opponent_id,'-',existingGame.location_id,'-',existingGame.start_date,'-',existingGame.label,'-',existingGame.uid)
                break
            }
        }
        return gameFound;
    },

    gameDetailsInTeamsnap: function (game,existingGames){
        let gameFound
        let opponent = getNameFromCollection(myOpponents,game.opponent)
        let location = getNameFromCollection(myLocations,game.location)

        //loop through existing games in TS and see if we find it.
        for (let existingGame of existingGames){
            let rs = new Date(game.rawStart.toString())
            let es = new Date(existingGame.start_date.toString())

            //Let's look at the details to try and find a meaningful match
            if ((opponent.id === existingGame.opponentId) && (location.id === existingGame.locationId)){                
                if (es.getTime() === rs.getTime()){// Let's now consider date and time in milliseconds
                    gameFound = existingGame
                    //console.log('found gameDetailsInTeamsnap:', existingGame.opponentId,'-',existingGame.locationId,'-',existingGame.start_date,'-',existingGame.label,'-',existingGame.uid)
                    //console.log('gameDetailsInTeamsnap-date check:', 'existing.start_date',es.getTime(),'- game.rawStart',rs.getTime(),'- game.date',game.date,'- game.start',game.start)
                    break
                }   
            }
        }
        return gameFound;
    },

    gameExistsInTeamsnap: function (game,existingTSGames){
        let gameFound

        let opponent = getNameFromCollection(myOpponents,game.opponent)
        let location = getNameFromCollection(myLocations,game.location)

        if(opponent && location){
            //loop through existing games in TS and see if we find it.
            for (let existingTSGame of existingTSGames){
                //Check ONE ... most accurate
                if (game.UID === existingTSGame.uid){
                    gameFound = existingTSGame
                    //console.log('gameUIDInTeamsnap:', existingTSGame.opponent_id,'-',existingTSGame.location_id,'-',existingTSGame.start_date,'-',existingTSGame.label,'-',existingTSGame.uid)
                    break
                } else {
                    let rs = new Date(game.rawStart.toString())
                    let es = new Date(existingTSGame.start_date.toString())

                    //Let's look at the details to try and find a meaningful match
                    if ((opponent.id === existingTSGame.opponentId) && (location.id === existingTSGame.locationId)){                
                        if (es.getTime() === rs.getTime()){// Let's now consider date and time in milliseconds
                            gameFound = existingTSGame
                            //console.log('found gameDetailsInTeamsnap:', existingGame.opponentId,'-',existingGame.locationId,'-',existingGame.start_date,'-',existingGame.label,'-',existingGame.uid)
                            //console.log('gameDetailsInTeamsnap-date check:', 'existing.start_date',es.getTime(),'- game.rawStart',rs.getTime(),'- game.date',game.date,'- game.start',game.start)
                            break
                        }   
                    }
                }
            }
        }else{
            if (!opponent) console.log(game.opponent,' not found in Teamsnap.')
            if (!location) console.log(game.location,' not found in Teamsnap.')
        }
        return gameFound;
    },

    createOpponentAndOrLocation: async function (game){
        let createdDependencies = false
        let opponent = getNameFromCollection(myOpponents,game.opponent)
        let location = getNameFromCollection(myLocations,game.location)

        if(!opponent){
            let fetchCreateOpponentPromise = await createOpponentPromise(game.opponent,myTeam.createOpponentsURL)
            createdDependencies = true
        }
        if (!location){
            let fetchCreateLocationPromise = await createLocationPromise('',game.location,'',myTeam.createLocationsURL)
            createdDependencies = true
        }
        return createdDependencies
    }
/*
    gameExistInTeamsnap: function (game,existingGames){
        let gameExists = false
        
        let opponent = getNameFromCollection(myOpponents,game.opponent)
        
        //console.log ('game',game)

        //loop through existing games in TS and see if we find it.
        existingGames.forEach(function (myGame){
            //Check ONE ... most accurate
            if (game.UID === myGame.uid){
                gameExists = true
                //console.log('We found this existing game based on UID, so we will skip:', myGame.opponent_id,'-',myGame.location_id,'-',myGame.start_date,'-',myGame.label,'-',myGame.uid)
            }else if((myGame.opponent_id === opponent.id) && (myGame.start_date === game.rawStart)){
                gameExists = true
                //console.log('We found this existing game based on opponent and start date, so we will skip:', myGame.opponent_id,'-',myGame.location_id,'-',myGame.start_date,'-',myGame.label,'-',myGame.uid)
                //console.log('Here is the game you want to create:',game.opponent,'-',game.location,'-',game.date,'-',game.start,'-',game.source,'-',game.UID)
            }
        });
    
        return gameExists;
    }
*/
};


//Private methods

function createOpponentPromise(name,url) {
    let payload = ''.concat(
        '{"template": { "data": [',
        '{"name":"name","value":"',name.trim(),'"},',
        '{"name":"team_id","value":"',myTeam.id,'"},',
        '{"name":"type","value":"opponent"}',
        ']}}'
    )

    if (!RO){
        return new Promise(resolve => {
            axios.post(url, payload,
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                console.log(response.data)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        });
    }else{
        console.log("create opponent ",payload , ' in collection ',url)
        return new Promise(resolve => {})
    } 
}

function createLocationPromise(name,address,locationUrl,url) {
    let payload = ''.concat(
        '{"template": { "data": [',
        '{"name":"name","value":"',name.trim(),'"},',
        '{"name":"url","value":"',locationUrl.trim(),'"},',
        '{"name":"address","value":"',address.trim(),'"},',
        '{"name":"team_id","value":"',myTeam.id,'"},',
        '{"name":"type","value":"location"}',
        ']}}'
    )

    if (!RO){
        return new Promise(resolve => {
            axios.post(url, payload,
                {
                    headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
                }
            )
            .then(function (response) {
                console.log(response.data)
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        });
    }else{
        console.log("create location ", payload , ' in collection ',url)
        return new Promise(resolve => {})
    }
}

function createGamePromise(data,url) {
    return new Promise(resolve => {
        axios.post(url, data,
            {
                headers: {'content-type': 'application/json', 'Authorization': 'Bearer '+ bearerToken}
            }
        )
        .then(function (response) {
            console.log(response.data)
        })
        .catch(function (error) {
            console.log(error);
        })
        .then(function () {
            // always executed
        });
    });
}

function getMe(itemsCollection){
    let me =  new Object();
    if (itemsCollection.length === 1){
        itemsCollection.forEach(function (mapItem) {
            me.href = mapItem.href
            me.teamsURL = getRelLink(mapItem.links,"active_teams")
            me.email = getDataFieldValue(mapItem.data,'email')
            me.firstName = getDataFieldValue(mapItem.data,'first_name')
            me.lastName = getDataFieldValue(mapItem.data,'last_name')
            me.id = getDataFieldValue(mapItem.data,'id')
        });
    } else console.log('Don\'t know who you are or there are too many of you....')    
        
    return me;
}

function getTeams(itemsCollection){
    let teams = []
    if (itemsCollection.length >= 1){
        
        itemsCollection.forEach(function (mapItem) {
            let team =  new Object();

            team.href = mapItem.href
            team.opponentsURL = getRelLink(mapItem.links,"opponents")
            team.locationsURL = getRelLink(mapItem.links,"locations")
            team.icalGameURL = getRelLink(mapItem.links,"calendar_http_games_only")
            team.eventsURL = getRelLink(mapItem.links,"events")
            team.name = getDataFieldValue(mapItem.data,'name')
            team.id = getDataFieldValue(mapItem.data,'id')
            team.sport_id = getDataFieldValue(mapItem.data,'sport_id')

            teams.push(team)
        });
    } else console.log('You have no teams')    
        
    return teams;
}

function getGames(itemsCollection){
    let games = []
    if (itemsCollection.length >= 1){
        itemsCollection.forEach(function (mapItem) {
            if (getDataFieldValue(mapItem.data,'is_game')){  
                let game =  new Object();

                game.href = mapItem.href
                game.opponentName = getDataFieldValue(mapItem.data,'opponent_name')
                game.opponentId = getDataFieldValue(mapItem.data,'opponent_id')
                game.locationName = getDataFieldValue(mapItem.data,'location_name')
                game.locationId = getDataFieldValue(mapItem.data,'location_id')
                game.start_date = getDataFieldValue(mapItem.data,'start_date')
                game.name = getDataFieldValue(mapItem.data,'name')
                game.id = getDataFieldValue(mapItem.data,'id')
                game.notes = getDataFieldValue(mapItem.data,'notes')
                game.uid = getUidFromNotes(game.notes)
                game.locationURL = getRelLink(mapItem.links,"location")
                game.assignmentsURL = getRelLink(mapItem.links,"assignments")
                game.availabilitiesURL = getRelLink(mapItem.links,"availabilities")

                games.push(game)
            }
        });
    } else console.log('You have no games for this team')    
        
    return games;
}

function getOpponents(itemsCollection){
    let opponents = []
    if (itemsCollection.length >= 1){
        itemsCollection.forEach(function (mapItem) {
            let opponent =  new Object();

            opponent.href = mapItem.href
            opponent.eventsURL = getRelLink(mapItem.links,"events")
            opponent.name = getDataFieldValue(mapItem.data,'name')
            opponent.id = getDataFieldValue(mapItem.data,'id')

            opponents.push(opponent)
        });
    } else console.log('You have no opponents for this team')    
        
    return opponents;
}

function getLocations(itemsCollection){
    let locations = []
    if (itemsCollection.length >= 1){
        itemsCollection.forEach(function (mapItem) {
            let location =  new Object();

            location.href = mapItem.href
            location.name = getDataFieldValue(mapItem.data,'name')
            location.id = getDataFieldValue(mapItem.data,'id')
            location.address = getDataFieldValue(mapItem.data,'address')
            location.url = getDataFieldValue(mapItem.data,'url')

            locations.push(location)
        });
    } else console.log('You have no locations for this team')    
        
    return locations;
}

function getNameFromCollection(collection,name){
    let targetThing
    collection.forEach(function (thing) {
        //console.log('thing.name',thing.name,'name',name,'thing.address',thing.address)
        if (thing.name.indexOf(name)>=0 || name.indexOf(thing.name)>=0){
            targetThing = thing
        }else if(thing.address && (thing.address.indexOf(name)>=0 || name.indexOf(thing.address)>=0)){
            targetThing = thing
        }
    });
    return targetThing;
}

function getDataFieldValue(linkMap,fieldName){
    let result
    linkMap.forEach(function (mapItem) {
        if(mapItem.name === fieldName){
            result = mapItem.value
        }
    });
    return result;
}

function getRelLink(linkMap,type){
    let result
    linkMap.forEach(function (mapItem) {
        //console.log('mapItem',mapItem.rel,'type',type)
        if(mapItem.rel === type){
            //console.log('href',mapItem.href)
            result = mapItem.href
        }
    });
    return result;
}

function getUidFromNotes(notes){
    let startingPos = notes.indexOf('UID:')
    if (startingPos>=0){
        let trimmedstr = notes.trim()
        let uid = trimmedstr.substr(4,trimmedstr.length-4)
        return uid;
    }
}

function formatDateForTeamsnap(game){
    let result = game.rawStart

    return result
}

function getDefaultGame(){
    let event = new Object()
    //Values need to be set by consumer
    event.opponent_id = null
    event.start_date = null
    event.team_id = null
    event.game_type = null
    event.icon_color = null
    event.location_id = null
    event.label = null
    event.notes = 'UID:' + ''
    //Defaulted values
    event.type = 'event'
    event.is_game = true
    event.duration_in_minutes = duration_in_minutes
    event.minutes_to_arrive_early = minutes_to_arrive_early
    event.notify_team = false
    event.time_zone = 'America/New_York'
    event.tracks_availability = true

    return event
}

function getDefaultTeam(){
    let team =  new Object();

    team.name = null
    team.id = null
    team.location_country = null
    team.location_postal_code = null
    team.time_zone = null
    team.sport_id = null
    team.division_id = null
    team.division_name = null
    team.season_name = null
    team.league_name = null
    team.league_url = null
    team.owner_first_name = null
    team.owner_last_name = null
    team.owner_email = null
    team.is_ownership_pending = null
    team.type = 'team'

    return team
}

//Logic to determine if a match is found in the replica, but the data is meanigfully different
function gamesChanged(masterGame, replicaGame){
    return false;
}
