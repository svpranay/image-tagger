var shortnerApp = angular.module('imageTaggerApp', []);

shortnerApp.controller('DataController', function ($scope, $http, $timeout) {

  $scope.items = [];
  $scope.imageurl = "";
  $scope.message = "Press start to start the game";
  $scope.lastmove = "Last move result.";

  $scope.submitguess = function () {
    var requestData = { "who" : $scope.id, "guess" : $scope.guess };
    $scope.websocket.send(JSON.stringify(requestData));
  }

  $scope.start = function () {
    $http({method: 'GET', url: '/game'}).
        success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.message = JSON.stringify(data);
          $scope.websocket = new WebSocket("ws://128.199.178.30:9001/start?gameid=" + data.id + "&userid=0");
          $scope.websocket.onmessage = function(event) {
            console.log(JSON.stringify(event.data));
            var d = JSON.parse(event.data);
            var data = d.photo;
            if (d.lastMove) {
                $scope.lastmove = "Awesome!! Tags matched.";
            } else {
                $scope.lastmove = "Ah crap!! Try harder.";
            }
            if (d.round == 9) {
                $scope.lastmove = $scope.lastmove + "Wonderful. You have reached the end of the game.";
            }

            $scope.$apply(function() {
                $scope.imageurl  = "https://farm" + data.farm + ".staticflickr.com/" + data.server + "/" + data.id + "_" + data.secret + ".jpg";
                $scope.guess = "";
            });

          };
        }).
        error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
  };

  $scope.join = function () {
        $scope.websocket = new WebSocket("ws://128.199.178.30:9001/start?gameid=" + $scope.gameid + "&userid=1");
        $scope.websocket.onmessage = function(event) {
            console.log(JSON.stringify(event.data));
            var d = JSON.parse(event.data);
            var data = d.photo;
            if (d.lastMove) {
                $scope.lastmove = "Awesome!! Tags matched.";
            } else {
                $scope.lastmove = "Ah crap!! Try harder.";
            }
            if (d.round == 9) {
                $scope.lastmove = $scope.lastmove + " Wonderful. You have reached the end of the game.";
            }

            $scope.$apply(function() {
                $scope.imageurl  = "https://farm" + data.farm + ".staticflickr.com/" + data.server + "/" + data.id + "_" + data.secret + ".jpg";
                $scope.guess = "";
            });


        };
    };
});

