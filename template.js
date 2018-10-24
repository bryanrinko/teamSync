'use strict'
let ical_utils = require('./icalUtils.js');

global.bearerToken = ''
global.tsTargetTeam = ''

global.HOME_GAME_TYPE_CODE = 1
global.HOME_GAME_TYPE = 'Home'
global.AWAY_GAME_TYPE_CODE = 2
global.AWAY_GAME_TYPE = 'Away'

global.duration_in_minutes = 50
global.minutes_to_arrive_early = 60

global.SCRIMMAGE_LABEL = 'Scrimmage'

global.MASTER_COMMISS_ICAL_URL = ''
global.MASTER_COMMISS_ICAL_DOMAIN = ''
global.MASTER_COMMISS_ICON_COLOR = 'yellow'
global.MASTER_COMMISS_LABEL = 'NON_LEAGUE'
global.MASTER_COMMISS_SIGNATURE = ''
global.MASTER_COMMISS_TEAM_TAG = 'Tag(s): '
global.MASTER_COMMISS_TEAM_NAME = ''

global.LEAGUE1_ICAL_URL = ''
global.LEAGUE1_ICAL_DOMAIN = ''
global.LEAGUE1_ICON_COLOR = 'orange'
global.LEAGUE1_LABEL = ""
global.LEAGUE1_SIGNATURE = 's'
global.LEAGUE1_TEAM_TAG = 'Tag(s): '
global.LEAGUE1_TEAM_NAME = ''

global.LEAGUE2_ICAL_URL = ''
global.LEAGUE2_ICAL_DOMAIN = ''
global.LEAGUE2_ICON_COLOR = 'purple'
global.LEAGUE2_LABEL = ""
global.LEAGUE2_SIGNATURE = 'NOTUNIQUE'
global.LEAGUE2_TEAM_TAG = 'Tag(s): '
global.LEAGUE2_TEAM_NAME = ''

global.TEAMSNAP_ICAL_URL = ''
global.TEAMSNAP_ICAL_DOMAIN = 'teamsnap'

ical_utils.launchSync(
    MASTER_COMMISS_ICAL_URL,
    LEAGUE1_ICAL_URL,
    LEAGUE2_ICAL_URL,
    TEAMSNAP_ICAL_URL
);
