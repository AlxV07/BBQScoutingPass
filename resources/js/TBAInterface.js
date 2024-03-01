// TBAInterface functions to pull data from TheBlueAlliance.com
let teams = null;
let schedule = null;
const authKey = "1rPmCc9vJOiTlJVJ7TOv0LFdrA2IYZoBfvBtRlIPPeS3CDgorpMT7RoI37RANKo2";

/**
 * Get list of teams in event
 *
 * @param {eventCode} eventCode the event code (i.e. 2020caln) to pull the team list
 */
function getTeams(eventCode) {
	if (authKey) {
		let xmlhttp = new XMLHttpRequest();
		let url = "https://www.thebluealliance.com/api/v3/event/" + eventCode + "/teams/simple";
		xmlhttp.open("GET", url, true);
		xmlhttp.setRequestHeader("X-TBA-Auth-Key", authKey);
		xmlhttp.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200) {
				let response = this.responseText;
				teams = JSON.parse(response);
			}
		};
		xmlhttp.send();
	}
}

/**
 * Get schedule for event
 *
 * @param {eventCode} eventCode the event code (i.e. 2020caln) to pull the team list
 */
function getSchedule(eventCode) {
	if (authKey) {
		let xmlhttp = new XMLHttpRequest();
		let url = "https://www.thebluealliance.com/api/v3/event/" + eventCode + "/matches/simple";
		xmlhttp.open("GET", url, true);
		xmlhttp.setRequestHeader("X-TBA-Auth-Key", authKey);
		xmlhttp.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200) {
				let response = this.responseText;
				schedule = JSON.parse(response);
			}
		};
		xmlhttp.send();
	}
}
