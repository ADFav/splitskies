var splitskies = angular.module('myApp', ['ngRoute', 'mobile-angular-ui', 'mobile-angular-ui.gestures']);

// splitskies.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
//     $routeProvider
//         .when('/', {
//             templateUrl: 'index.html',
//             controller: 'testController'
//         })
// }]);

splitskies.directive('dragMe', ['$drag', function($drag){
  return {
    controller: function($scope, $element) {
      $drag.bind($element, 
        {
          // limit movement of element to its parent
          transform: $drag.TRANSLATE_INSIDE($element.parent()),

          end: function(drag) {
            // go back to initial position
            drag.reset();
          }
        },
        { // release touch when movement is outside bounduaries
          sensitiveArea: $element.parent()
        }
      );
    }
  };
}]);

var r;


var previewImage;
var img_height, img_width;
var takeImage;

splitskies.controller("testController", function($scope, $http, SharedState, $drag) {
  SharedState.initialize($scope, "modal1", false);

  $scope.receipt_img = "";
  $scope.lineItems = [];
  $scope.img_width = 0;
  $scope.img_height = 0;
  $scope.people = [];
  $scope.modal1 = false;

  $scope.priceify = x => "$" + parseFloat(x).toFixed(2)
  $scope.currentLineItem = null;

  previewImage = function(elem) {
    var reader = new FileReader();
    reader.readAsDataURL(elem.files[0]);
    reader.onloadend = function(e) {
      $scope.receipt_img = reader.result;
      $scope.$apply();
      var img = new Image();
      img.onload = function() {
        $scope.img_width = img.width;
        $scope.img_height = img.height;
        $scope.uploadFile();
      };
      img.src = reader.result;
    };
  };

  $scope.uploadFile = function() {
    $http.post("/analyze", { "img": $scope.receipt_img, "width": $scope.img_width, "height": $scope.img_height })
      .then(function(response) {
        r = response.data;
        $scope.lineItems = response.data;
        $scope.lineItems.forEach(function(lineItem) {
          lineItem.classes = ["lineItem"];
        });
      }, function(err) {
        console.log(err);
      });
  };


  var colors = ["red", "green", "blue", "orange", "yellow", "purple", "silver"];

  $scope.addPerson = function() {
    var person = {};
    person.name = prompt("Name?");
    person.subtotal = 0;
    person.items = [];
    person.style = { "background-color": colors[$scope.people.length % colors.length] };
    $scope.people.push(person);
  };

  $scope.assign = function(lineItem, person) {
    lineItem.style["background-color"] = person.style["background-color"];
    person.items.push(lineItem);
    lineItem.owner = person;
    person.subtotal = person.items.map(i => parseFloat(i.price)).reduce((a, b) => a + b, 0);
    $scope.currentLineItem.classes.pop(1);
    $scope.currentLineItem = null;
  };

  $scope.modalButtonClickHandler = function() {
    console.log(SharedState.get("modal1"));
    SharedState.turnOn("modal1");
  };

  $scope.lineItemClickHandler = function(lineItem) {
    console.log(lineItem.price);
    if (lineItem == $scope.currentLineItem) {
      SharedState.turnOn("modal1");
    }
    else {
      if ($scope.currentLineItem) {
        $scope.currentLineItem.classes.pop(1);
      }
      $scope.currentLineItem = lineItem;
      $scope.currentLineItem.classes.push("selected");
    }
  };

  $scope.editLineItem = function(lineItem, changes) {

  }
});
