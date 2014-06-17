var shortnerApp = angular.module('imageTaggerApp', []);

shortnerApp.controller('DataController', function ($scope, $http, $timeout) {

  $scope.items = [];
  $scope.id = 0;
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
          $scope.websocket = new WebSocket("ws://localhost:9000/start?gameid=" + data.id + "&userid=" + $scope.id);
          $scope.websocket.onmessage = function(event) {
            console.log(JSON.stringify(event.data));
            var d = JSON.parse(event.data);
            var data = d.photo;
            if (d.lastMove) {
                $scope.lastmove = "Awesome!! Tags matched.";
            } else {
                $scope.lastmove = "Ah crap!! Try harder.";
            }

            $scope.$apply(function() {
                $scope.imageurl  = "https://farm" + data.farm + ".staticflickr.com/" + data.server + "/" + data.id + "_" + data.secret + ".jpg";
            });

          };
        }).
        error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
  };

  $scope.join = function () {
        $scope.websocket = new WebSocket("ws://localhost:9000/start?gameid=" + $scope.gameid + "&userid=" + $scope.id);
        $scope.websocket.onmessage = function(event) {
            console.log(JSON.stringify(event.data));
            var d = JSON.parse(event.data);
            var data = d.photo;
            if (d.lastMove) {
                $scope.lastmove = "Awesome!! Tags matched.";
            } else {
                $scope.lastmove = "Ah crap!! Try harder.";
            }

            $scope.$apply(function() {
                $scope.imageurl  = "https://farm" + data.farm + ".staticflickr.com/" + data.server + "/" + data.id + "_" + data.secret + ".jpg";
            });

        };
    };
});

