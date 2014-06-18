var shortnerApp = angular.module('imageTaggerApp', []);

shortnerApp.controller('DataController', function ($scope, $http, $timeout) {

  $scope.userid = 0;
  $scope.items = [];
  $scope.imageurl = "";
  $scope.message = "Press start to start the game or join a game already started.";
  $scope.lastmove = "";
  $scope.showguessbox = true;

  $scope.submitguess = function () {
    var requestData = { "who" : $scope.userid, "guess" : $scope.guess };
    $scope.websocket.send(JSON.stringify(requestData));
  }

  $scope.start = function () {
    $http({method: 'GET', url: '/game'}).
        success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          $scope.userid = 0;
          
           $scope.message = JSON.stringify(data);
          $scope.websocket = new WebSocket("ws://128.199.178.30:9001/start?gameid=" + data.id + "&userid=0");
          $scope.websocket.onmessage = function(event) {
            console.log(JSON.stringify(event.data));
            var d = JSON.parse(event.data);
            var data = d.photo;
            if (d.round != 0) {
		if (d.lastMove) {
                    $scope.lastmove = "Awesome!! Tags matched.";
		} else {
                    $scope.lastmove = "Ah crap!! Try harder.";
		}
	    } else {
		$scope.lastmove = "";
	    }
            if (d.round == 9) {
                $scope.lastmove = $scope.lastmove + "Wonderful. You have reached the last round of the game.";
            }
            $scope.guess = "";
	    if (d.round == 10) {
		$scope.lastmove = "Thank you for playing. Game over.";		
		$scope.showguessbox = false;
	    } else {
                $scope.imageurl  = "https://farm" + data.farm + ".staticflickr.com/" + data.server + "/" + data.id + "_" + data.secret + ".jpg";
	    }
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
            $scope.userid=1;
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

