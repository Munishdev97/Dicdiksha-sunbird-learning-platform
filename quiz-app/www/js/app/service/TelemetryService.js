TelemetryService = {
    _gameData: undefined,
    _config: {
        isActive: true,
        outputFile: "genie_PACKAGE_output.json",
        errorFile: "PACKAGE_error.json",
        nameResetKey: 'PACKAGE',
        events: {
            "OE_START": {
                "eks": [],
                "ext": []
            },
            "OE_END": {
                "eks": [
                    "length"
                ],
                "ext": []
            },
            "OE_LEARN": {
                "eks": [],
                "ext": []
            },
            "OE_ASSESS": {
                "eks": [],
                "ext": []
            },
            "OE_LEVEL_SET": {
                "eks": [],
                "ext": []
            },
            "OE_INTERACT": {
                "eks": [],
                "ext": []
            },
            "OE_INTERRUPT": {
                "eks": [],
                "ext": []
            },
            "OE_MISC": {
                "eks": [],
                "ext": []
            }
        },
        timeout: 2000,
        retryLimit: 10,
        minDataToWrite: 10,
        _eventVersion: 1.0
    },
    _user: undefined,
    _baseDir: 'QuizApp',
    _gameOutputFile: undefined,
    _gameErrorFile: undefined,
    _events: {
        'OE_START': [],
        'OE_END': [],
        'OE_ASSESS': [],
        'OE_INTERACT': []
    },
    init: function(user, gameData, config) {
        if (config) {
            for (key in config) {
                TelemetryService._config[key] = config[key];
            }
        }
        if (user && gameData) {
            if(gameData.id && gameData.ver) {
                TelemetryService._parentGameData = gameData;
                TelemetryService._gameData = gameData;
            } else {
                TelemetryService.exitWithError('Invalid game data.');
            }
            if(user.sid && user.uid && user.did) {
                TelemetryService._user = user;    
            } else {
                TelemetryService.exitWithError('Invalid user session data.');
            }
            TelemetryService._gameOutputFile = TelemetryService._baseDir + '/' + TelemetryService._config.outputFile.replace(TelemetryService._config.nameResetKey, gameData.id);
            TelemetryService._gameErrorFile = TelemetryService._baseDir + '/' + TelemetryService._config.errorFile.replace(TelemetryService._config.nameResetKey, gameData.id);
            TelemetryService.createFiles();
        } else {
            TelemetryService.exitWithError('User or Game data is empty.');
        }
    },
    exitWithError: function(error) {
        var message = 'Telemetry Service initialization faild. Please contact game developer.';
        if(error) message += ' Error: '+error;
        alert(message);
        TelemetryService.exitApp();
    },
    validateEvent: function(eventStr, eventData) {
        return true;
    },
    createEventObject: function(eventName, eventData, gameData) {
        return {
            "eid": eventName.toUpperCase(),
            "ts": new Date(),
            "ver": TelemetryService._eventVersion, 
            "gdata": gameData || TelemetryService._gameData,
            "sid": TelemetryService._user.sid,
            "uid": TelemetryService._user.uid,
            "did": TelemetryService._user.did,
            "edata": eventData
        }
    },
    startGame: function(eventData, game) {
        if (TelemetryService._config.isActive) {
            var eventName = 'OE_START';
            if(game && game.id && game.ver && game.type) {
                TelemetryService._gameData = game;
            }
            var eventStr = TelemetryService._config.events[eventName.toUpperCase()];
            if (eventStr) {
                if (TelemetryService.validateEvent(eventStr, eventData)) {
                    var event = TelemetryService.createEventObject(eventName, eventData);
                    TelemetryService._events[eventName].push(event);
                }
            } else {
                console.log('Invalid event:' + eventName);
            }
        } else {
            console.log('TelemetryService is inActive.');
        }
    },
    endGame: function(eventData, game) {
        if (TelemetryService._config.isActive) {
            var eventName = 'OE_END';
            var validGame = null;
            if(game && game.id && game.ver && game.type) {
                validGame = game;
            }
            var eventStr = TelemetryService._config.events[eventName.toUpperCase()];
            if (eventStr) {
                if (TelemetryService.validateEvent(eventStr, eventData)) {
                    var event = TelemetryService.createEventObject(eventName, eventData, validGame);
                    TelemetryService._events[eventName].push(event);
                }
            } else {
                console.log('Invalid event:' + eventName);
            }
            TelemetryService._gameData = TelemetryService._parentGameData;
        } else {
            console.log('TelemetryService is inActive.');
        }
    },
    interact: function(eventData) {
    },
    assess: function(eventData, status) {
    },
    createFiles: function() {
        filewriterService.createBaseDirectory(TelemetryService._baseDir, function() {
            console.log('file creation failed...');
        });
        filewriterService.createFile(TelemetryService._gameOutputFile, function(fileEntry) {
            console.log(fileEntry.name + ' created successfully.');
        }, function() {
            console.log('file creation failed...');
        });
        filewriterService.createFile(TelemetryService._gameErrorFile, function(fileEntry) {
            console.log(fileEntry.name + ' created successfully.');
        }, function() {
            console.log('file creation failed...');
        });
    },
    flush: function(exit) {
        var data = _.union(TelemetryService._events['OE_START'], TelemetryService._events['OE_END'], TelemetryService._events['OE_ASSESS'], TelemetryService._events['OE_INTERACT']);
        if(data && data.length > 0) {
            data = JSON.stringify(data);
            data = data.substring(1, data.length - 1);
            filewriterService.getFileLength(TelemetryService._gameOutputFile)
            .then(function(fileSize) {
                console.log('fileSize:', fileSize);
                if(fileSize == 0) {
                    data = '{"events":[' + data;
                    if(exit) data += ']}';
                } else {
                    data = ', ' + data;
                    if(exit) data += ']}';
                }
                filewriterService.writeFile(TelemetryService._gameOutputFile, data, function() {
                    console.log('File write completed...');
                }, function() {
                    console.log('Error writing file...');
                });
                TelemetryService.clearEvents();
                console.log('events after clear: ',TelemetryService._events);
            })
            .catch(function(err) {
                console.log('Error:', err);
            });
        } else {
            console.log('No data to write...');
        }
    },
    clearEvents: function() {
        for(eventName : TelemetryService._events) {
            TelemetryService._events[eventName] = [];
        }
    }
    printAll: function() {
        console.log('gameData:', TelemetryService._gameData);
        console.log('user:', TelemetryService._user);
        console.log('_gameOutputFile:', TelemetryService._gameOutputFile);
        console.log('_gameErrorFile:', TelemetryService._gameErrorFile);
        console.log('config:', TelemetryService._config);
        console.log('events config (name):', Object.keys(TelemetryService._config.events));
        console.log('events data: ', TelemetryService._events);
    },
    exitApp: function() {
        setTimeout(function() {
            navigator.app.exitApp();
        }, 5000);
    }
}

var filewriterService = new CordovaFilewriterService();
