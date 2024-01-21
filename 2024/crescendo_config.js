
// TODO Bicycle StartCycle button + behind-the-scenes timekeeping
// TODO Bicycle ShotFrom:clickable_image


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
            "defaultValue": "Alx",
            "required": "true"
        },
        {
            "name": "Event",
            "code": "e",
            "type": "event",
            "defaultValue": "Null",
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
            "defaultValue": "r1",
            "required": "true"
        },
        {
            "name": "Team #",
            "code": "t",
            "type": "team",
            "min": 1,
            "defaultValue": 2714,
            "max": 99999
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
            "name": "Leave Starting Zone",
            "code": "al",
            "type": "bool"
        },
        {
            "name": "Notes",
            "code": "an",
            "type": "text"
        }
    ],
    "teleop": [
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
            "name": "Coop Bonus",
            "code": "cp",
            "type": "bool"
        },
        {
            "name": "Times Amplified by HP",
            "code": "tam",
            "type": "counter"
        },
        {
            "name": "Cycle Timer",
            "code": "ct",
            "type": "timer"
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
            "name": "High Notes",
            "code": "hn",
            "type": "counter"
        },
        {
            "name": "Failed High Notes",
            "code": "fhn",
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
            "name": "Goes under stage",
            "code": "us",
            "type": "bool"
        },
        {
            "name": "Comments",
            "code": "co",
            "type": "text",
            "size": 15,
            "maxSize": 100
        },
        {
            "name": "RP",
            "code": "rp",
            "type": "text",
            "size": 1,
            "maxSize": 1
        },
        {
            "name": "Final Match Score",
            "code": "fms",
            "type": "text",
            "size": 1,
            "maxSize": 3
        }
    ]
}`;
