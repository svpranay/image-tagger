var shortnerApp = angular.module('imageTaggerApp', []);

shortnerApp.controller('DataController', function ($scope, $http, $timeout) {

  $scope.userid = 0;
  $scope.items = [];
  $scope.imageurl = "";
  $scope.message = "Press start to start the game or join a game already started.";
  $scope.lastmove = "";
  $scope.showguessbox = true;
  $scope.rounds_in_game = 10;
  $scope.first_round = 0;

  $scope.submitguess = function () {
    var requestData = { "who" : $scope.userid, "guess" : $scope.guess };
    $scope.websocket.send(JSON.stringify(requestData));
  }

  $scope.start = function () {
    $http({method: 'GET', url: '/game'}).
        success(function(data, status, headers, config) {
          $scope.userid = 0;
          $scope.message = JSON.stringify(data);
          $scope.websocket = new WebSocket("ws://128.199.178.30:80/start?gameid=" + data.id + "&userid=0");
          $scope.websocket.onmessage = function(event) {
            handleMove(event, $scope);
          }
          });
  };

  $scope.join = function () {
        $scope.websocket = new WebSocket("ws://128.199.178.30:80/start?gameid=" + $scope.gameid + "&userid=1");
        $scope.websocket.onmessage = function(event) {
            $scope.userid=1;
            handleMove(event, $scope);
        };
    };

    function handleMove(event, $scope) {
        console.log(JSON.stringify(event.data));
        var d = JSON.parse(event.data);
        var data = d.photo;
        if (d.round != $scope.first_round) {
            if (d.lastMove) {
                $scope.lastmove = "Ah smart guys!! You and your opponent got the same tag.";
            } else {
                $scope.lastmove = "Oh crap!! Try harder to match your friends tag.";
            }
        } else {
            $scope.lastmove = "The game begins now...";
        }
        var game_ended = false;
        if (d.round == $scope.rounds_in_game) {
            console.log("End the game now.");
            $scope.lastmove = $scope.lastmove + " " + "Unfortunately, things always come to an end.";
            game_ended = true;
        }
        $scope.$apply(function() {
            $scope.imageurl  = "https://farm" + data.farm + ".staticflickr.com/" + data.server + "/" + data.id + "_" + data.secret + ".jpg";
            $scope.guess = "";
            if (game_ended) {
                $scope.showguessbox = false;
            }
        });
    }
});

