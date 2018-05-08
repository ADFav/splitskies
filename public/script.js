var splitskies = angular.module('myApp', ['ngRoute', 'mobile-angular-ui', 'mobile-angular-ui.gestures']);

// splitskies.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
//     $routeProvider
//         .when('/', {
//             templateUrl: 'index.html',
//             controller: 'testController'
//         })
// }]);

splitskies.directive('dragMe', ['$drag', function($drag) {
  return {
    controller: function($scope, $element) {
      $drag.bind($element, {
        // limit movement of element to its parent
        transform: $drag.TRANSLATE_INSIDE($element.parent().parent()),

        end: function(drag) {
          // go back to initial position
          drag.reset();
        }
      }, { // release touch when movement is outside boundaries
        sensitiveArea: $element.parent()
      });
    }
  };
}]);

var r;


var previewImage;

splitskies.controller("testController", function($scope, $http, SharedState, $drag) {
  $scope.welcomeModal = true;
  SharedState.turnOn("welcomeModal");

  $scope.receipt_img = "";
  $scope.lineItems = [];
  $scope.img_width = 0;
  $scope.img_height = 0;
  $scope.people = [];
  $scope.modal1 = false;

  $scope.priceify = x => "$" + parseFloat(x).toFixed(2);
  $scope.currentLineItem = null, $scope.currentPerson = null;

  previewImage = function(elem) {
    var reader = new FileReader();
    reader.readAsDataURL(elem.files[0]);
    reader.onloadend = function(e) {
      console.log(e);
      $scope.receipt_img = reader.result;
      $scope.$apply();
      var img = new Image();
      img.onload = function() {
        var img_width = (img.width < img.height ? img.width : img.height);
        var img_height = (img.width >= img.height ? img.width : img.height);
        var canvas = document.getElementById("receipt-canvas");
        var ctx = canvas.getContext("2d");
        var scaleFactor = parseFloat(window.innerWidth) / parseFloat(img_width);
        canvas.height = img_height * scaleFactor;
        canvas.width = img_width * scaleFactor;
        var receipt_img = document.getElementById("receipt_img");

        if (img.width > img.height) {
          console.log("Oh god");
          ctx.rotate(0.5 * Math.PI);
          ctx.scale(scaleFactor, scaleFactor);
          ctx.drawImage(receipt_img, 0, -1 * img_width);
        }
        else {
          ctx.scale(scaleFactor, scaleFactor);
          ctx.drawImage(receipt_img, 0, 0);
        }
        $scope.uploadFile(canvas.toDataURL('image/jpeg', 1.0), canvas.width, canvas.height);
      };
      img.src = reader.result;
    };
  };

  $scope.uploadFile = function(receipt, width, height) {
    $http.post("/analyze", { "img": receipt, "width": width, "height": height })
      .then(function(response) {
        r = response.data;
        $scope.lineItems = response.data;
        $scope.lineItems.forEach(function(lineItem) {
          lineItem.classes = ["lineItem"];
          console.log(lineItem.text);
          if( lineItem.price > 500 || 
              lineItem.price <= 0 || 
              lineItem.text.toLowerCase().indexOf("total") > 0 || 
              lineItem.text.toLowerCase().indexOf("cash") > 0 ||
              lineItem.text.toLowerCase().indexOf("change") > 0 ){
            lineItem.classes.push("dont-show");
          }
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

  $scope.calculateSubtotal = function(person) {
    return $scope.lineItems
      .filter(lineItem => lineItem.owner == person)
      .map(lineItem => parseFloat(lineItem.price))
      .reduce((price, subtotal) => price + subtotal, 0);
  };

  $scope.assign = function(lineItem, person) {
    console.log("assign");
    var oldOwner = lineItem.owner;
    lineItem.owner = person;
    lineItem.style["background-color"] = person.style["background-color"];
    if (oldOwner) {
      oldOwner.items = oldOwner.items.filter(item => item != lineItem);
      oldOwner.subtotal = $scope.calculateSubtotal(oldOwner);
    }

    person.items.push(lineItem);
    person.subtotal = $scope.calculateSubtotal(person);
    $scope.currentLineItem.classes = $scope.currentLineItem.classes.filter(c => c != "selected");
    $scope.currentLineItem = null;
  };

  $scope.lineItemClickHandler = function(lineItem) {
    console.log(lineItem.price);
    if (lineItem == $scope.currentLineItem) {
      SharedState.turnOn("lineItemModal");
    }
    else {
      if ($scope.currentLineItem) {
        $scope.currentLineItem.classes.pop(1);
      }
      $scope.currentLineItem = lineItem;
      $scope.currentLineItem.classes.push("selected");
      $scope.currentLineItem.classes = $scope.currentLineItem.classes.filter(c => c != "dont-show");
    }
  };

  $scope.personClickHandler = function(person) {
    if ($scope.currentLineItem) {
      $scope.assign($scope.currentLineItem, person);
    }
    else {
      if (person == $scope.currentPerson) {
        SharedState.turnOn("personModal");
      }
    }
    $scope.currentPerson = person;
  };


  $scope.editLineItem = function(lineItem, changes) {

  }
});
