var splitskies = angular.module('myApp', ['ngRoute', 'mobile-angular-ui']);

// splitskies.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
//     $routeProvider
//         .when('/', {
//             templateUrl: 'index.html',
//             controller: 'testController'
//         })
// }]);

var r;
splitskies.controller("testController", function($scope, $http) {
    $scope.uploadFile = function() {
        var file = document.getElementById("fileUploader").files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            console.log(reader.result.length);
            $http.post("/analyze", { "img": reader.result }).then(function(response) {
                $scope.s = "Results recieved";
                r = response.data;
                console.log(r);
                console.log(parseText(r));
            }, function(err) {
                console.log(err);
            })
        }
    }
});

function parseText(GCV_result) {
    var result = "";
    try {
        GCV_result[0].fullTextAnnotation.pages[0].blocks.forEach(function(block) {
            result += "\n--------";
            block.paragraphs.forEach(function(paragraph) {
                result += "\n";
                paragraph.words.forEach(function(word) {
                    result += " ";
                    word.symbols.forEach(function(symbol) {
                        result += symbol.text;
                    });
                });
            });
        });
    }
    catch (e) {
        console.log("Whoops!");
        console.log(result);
        throw e;
    }
    return result;
}
