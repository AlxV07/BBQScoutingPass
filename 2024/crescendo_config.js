const config_data = `
{
    "dataFormat": "kvs",
    "title": "BBQScoutingPASS 2024",
    "page_title": "FRC 2024: Crescendo",
    "checkboxAs": "10",
    "prematch": [
        {
            "name": "Scouter Initials",
            "code": "s",
            "type": "scouter",
            "size": 5,
            "maxSize": 5,
            "defaultValue": "",
            "required": "true"
        },
        {
            "name": "Event",
            "code": "e",
            "type": "event",
            "defaultValue": "2024txcmp2",
            "required": "true"
        },
        {
            "name": "Match Level",
            "code": "l",
            "type": "level",
            "choices": {
                "qm": "Quals<br>",
                "sf": "Semifinals<br>",
                "f": "Finals"
            },
            "defaultValue": "qm",
            "required": "true"
        },
        {
            "name": "Match #",
            "code": "m",
            "type": "match",
            "min": 1,
            "max": 150,
            "defaultValue": 1,
            "required": "true"
        },
        {
            "name": "Robot",
            "code": "r",
            "type": "robot",
            "choices": {
                "r1": "Red-1",
                "b1": "Blue-1<br>",
                "r2": "Red-2",
                "b2": "Blue-2<br>",
                "r3": "Red-3",
                "b3": "Blue-3"
            },
            "required": "true"
        },
        {
            "name": "Team #",
            "code": "t",
            "type": "team",
            "min": 1,
            "max": 99999,
	    "required": "true"
        },
        {
            "name": "Auto Start Position",
            "code": "as",
            "type": "clickable_image",
            "filename": "2024/field_image.png",
            "clickRestriction": "one",
            "shape": "circle 4 white orangered true"
        }
    ],
    "auton": [
        {
            "name": "Left Starting Zone",
            "code": "las",
            "type": "bool"
        },
        {
            "name": "Auton Notes",
            "code": "an",
            "type": "text",
            "size": 15,
	        "defaultValue": "",
            "maxSize": 100
        },
        {
            "name": "Bicycle",
            "code": "teleopbicycle",
            "type": "bicycle",
            "bicycle_id": "auton"
        },
        {
            "name": "End with:",
            "code": "ew",
            "type": "radio",
             "choices": {
              "c1": "C1",
              "p1": "P1",
              "pl": "Preload<br>",
              "c2": "C2",
              "p2": "P2",
	      "na": "Nothing<br>",
              "c3": "C3",
              "p3": "P3<br>",
              "c4": "C4<br>",
              "c5": "C5"
             },
             "defaultValue": "pl"
        }
    ],
    "teleop": [
        {
            "name": "Defense Timer",
            "code": "dt",
            "type": "timer"
        },
        {
            "name": "Shots blocked",
            "code": "sb",
            "type": "counter"
        },
        {
            "name": "Was Defended",
            "code": "wd",
            "type": "bool"
        },
        {
            "name": "Failed Collections",
            "code": "fc",
            "type": "counter"
        },
        {
            "name": "HP Ground",
            "code": "hpg",
            "type": "bool"
        },
        {
            "name": "HP Other",
            "code": "hpo",
            "type": "bool"
        },
        {
            "name": "Ground",
            "code": "gr",
            "type": "bool"
        },
        {
            "name": "O.G. Auton",
            "code": "oga",
            "type": "bool"
        },
        {
            "name": "Alliance Partner",
            "code": "al",
            "type": "bool"
        },
        {
            "name": "Bicycle",
            "code": "teleopbicycle",
            "type": "bicycle",
            "bicycle_id": "teleop"
        }
    ],
    "endgame": [
        {
            "name": "Stage Timer",
            "code": "st",
            "type": "timer"
        },
        {
            "name": "Final Status",
            "code": "fs",
            "type": "radio",
            "choices": {
                "p": "Parked<br>",
                "o": "Onstage<br>",
                "s": "Onstage (Spotlit)<br>",
                "x": "NOOB"
            },
            "defaultValue": "x"
        },
        {
            "name": "Trap",
            "code": "ts",
            "type": "counter"
        },
        {
            "name": "Failed Trap",
            "code": "ft",
            "type": "counter"
        },
        {
            "name": "Harmony",
            "code": "ha",
            "type": "counter"
        }
    ],
    "postmatch": [
        {
            "name": "Was Fouled",
            "code": "wf",
            "type": "bool"
        },
        {
            "name": "Fouls",
            "code": "fo",
            "type": "counter"
        },
        {
            "name": "Defense Rating",
            "code": "dr",
            "type": "radio",
            "choices": {
                "b": "Below Average<br>",
                "a": "Average<br>",
                "g": "Good<br>",
                "e": "Excellent<br>",
                "x": "Did not play defense"
            },
            "defaultValue": "x"
        },
        {
            "name": "Tippy-ness<br>(5 = died/tipped)",
            "code": "tip",
            "type": "radio",
            "choices": {
                "a": "0 ",
                "b": "1 ",
                "c": "2 ",
                "d": "3 ",
                "e": "4 ",
                "f": "5 "
            },
            "defaultValue": "a"
        },
        {
            "name": "Coop Bonus",
            "code": "cp",
            "type": "bool"
        },
        {
            "name": "Ranking Points",
            "code": "rp",
            "type": "text",
            "size": 3,
            "maxSize": 3
        },
        {
            "name": "Final Match Score",
            "code": "fms",
            "type": "text",
            "size": 3,
            "maxSize": 3
        },
        {
            "name": "Notes",
            "code": "co",
            "type": "text",
            "size": 15,
            "maxSize": 100
        }
    ]
}`;
