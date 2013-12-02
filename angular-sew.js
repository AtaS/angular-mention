var sew = angular.module('angular-sew', []);

var TOKEN = '@';
var REGEX = new RegExp('(^|\\b|\\s)' + TOKEN + '([\\w.]*)$');

sew.service('sew_input', function () {
  return {
    userlist: [
      {name: 'AAA Alpha Smith 235', nickname: 'Alpha', nid: 1007},
      {name: 'BBB Bravo Smith 245', nickname: 'Beta', nid: 1008},
      {name: 'CCC Charlie Smith 246', nickname: 'Gamma', nid: 1009},
      {name: 'DDD Delta Smith 346', nickname: 'Delta', nid: 1010},
      {name: 'EEE Echo Smith 356', nickname: 'Echo', nid: 1011}
    ]
  };
});

var CSS_CONSTANTS = {
  container: '-sew-list-container',
  list: '-sew-list',
  listItem: '-sew-list-item',
  selected: 'selected'
};

var LIST_DATA = {
  token: 'nickname',
  longform: 'name',
  id: 'nid'
};

var LIST_ITEM_TEMPLATE = "<div><span>@{{v." + LIST_DATA.token + "}}</span>&nbsp;<small>({{v." + LIST_DATA.longform + "}})</small></div>";

var LIST_TEMPLATE = "<div><div class='" + CSS_CONSTANTS.container + "' style='display: none; position: absolute;'><ul class='" + CSS_CONSTANTS.list + "'><li ng-repeat='v in values | filter:mention' ng-click='choose(\"{{v." + LIST_DATA.token + "}}\")' ng-Mouseover='onhover($event)' class='" + CSS_CONSTANTS.listItem + "'>" + LIST_ITEM_TEMPLATE + "</li></ul></div><div ng-transclude></div></div>";

sew.directive('typeahead', function () {
  return {
    restrict: 'A',
    replace: true,
    transclude: true,
    template: LIST_TEMPLATE,
    scope: {
      typeahead: '@'
    },
    controller: function ($scope, sew_input, $log) {
      $scope.options = {};

      $scope.focusIndex = false;
      $scope.listVisible = false;

      $scope.values = sew_input[$scope.typeahead];
      $scope.options.values = $scope.values;

      $scope.matched = false;

      var padSelection = function (selection) {
        if (selection.substr(-1) !== ' ') {
          return selection + ' ';
        }
      };

      var setText = function (element, newText) {
        element.value = newText;
      }

      $scope.getChoices = function () {
        return angular.element($scope.element).find('ul').find('li');
      };

      $scope.onhover = function (obj) {
        var source = angular.element(obj.srcElement);
        if (!source.hasClass(CSS_CONSTANTS.listItem)) {
          return;
        }
        
        // $log.debug('[Event] mouseover: ', obj);

        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
        source.addClass(CSS_CONSTANTS.selected);

        angular.forEach(lis, function (li, i) {
          if (angular.element(li).hasClass(CSS_CONSTANTS.selected)) {
            $scope.focusIndex = i;
          }
        });
        //source[0].scrollIntoView();
      };

      $scope.choose = function (selection) {
        var $textElement = $scope.textElement;
        var $textValue = $textElement.value;

        selection = padSelection(selection);

        var replacementStart = $scope.cursorPos - $scope.find.length;
        var replacementEnd = $scope.cursorPos;

        var before = $textValue.slice(0, replacementStart);
        var replace = $textValue.slice(replacementStart, replacementEnd);
        var after = $textValue.slice(replacementEnd);

        var newText = before + TOKEN + selection + after;

        setText($textElement, newText);

        setCaretToPos($textElement, $scope.cursorPos + selection.length);
        $scope.hideList();
      };


      $scope.reset = function () {
        $scope.focusIndex = -1;
        $scope.listVisible = false;
        $scope.matched = false;
      };

      $scope.hideList = function () {
        $scope.$itemList.style.display = 'none';
        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
        $scope.reset();
      };

      $scope.displayList = function () {
        $scope.listVisible = true;
        $scope.$itemList.style.display = 'block';
        $scope.focusIndex = false;

        var offset = $scope.element.getBoundingClientRect();
        $scope.$itemList.style.left = offset.left + 'px';
        $scope.$itemList.style.top = offset.bottom + 'px';
        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
      };






      $scope.tab = function ($event) {
        // $log.debug('[Event] KeyDown: tab');
        var lis = $scope.getChoices();
        angular.element(lis[$scope.focusIndex]).triggerHandler('click');
      };

      $scope.enter = function ($event) {
        // $log.debug('[Event] KeyDown: return');
        var lis = $scope.getChoices();
        angular.element(lis[$scope.focusIndex]).triggerHandler('click');
      };

      $scope.escape = function ($event) {
        // $log.debug('[Event] KeyDown: escape');
        $scope.hideList();
      };

      $scope.upArrow = function ($event) {
        // $log.debug('[Event] KeyDown: upArrow');
        var lis = $scope.getChoices();
        if ($scope.focusIndex === false) {
          $scope.focusIndex = 0;
        }
        $scope.focusIndex = ($scope.focusIndex + lis.length - 1) % lis.length;
        lis.removeClass(CSS_CONSTANTS.selected);
        angular.element(lis[$scope.focusIndex]).addClass(CSS_CONSTANTS.selected);
        lis[$scope.focusIndex].scrollIntoView();
      };

      $scope.downArrow = function ($event) {
        // $log.debug('[Event] KeyDown: downArrow');
        var lis = $scope.getChoices();
        if ($scope.focusIndex === false) {
          $scope.focusIndex = -1;
        }
        $scope.focusIndex = ($scope.focusIndex + 1) % lis.length;
        lis.removeClass(CSS_CONSTANTS.selected);
        angular.element(lis[$scope.focusIndex]).addClass(CSS_CONSTANTS.selected);
        lis[$scope.focusIndex].scrollIntoView();
      };



      //http://unixpapa.com/js/key.html
      //http://stackoverflow.com/questions/17388021/navigate-the-ui-using-only-keyboard
      //http://plnkr.co/edit/XRGPYCk6auOxmylMe0Uu?p=preview
      $scope.keys = [];
      $scope.keys.push({ code: 9, action: $scope.tab });
      $scope.keys.push({ code: 13, action: $scope.enter });
      $scope.keys.push({ code: 27, action: $scope.escape });
      $scope.keys.push({ code: 38, action: $scope.upArrow });
      $scope.keys.push({ code: 40, action: $scope.downArrow });
      
      $scope.$on('keydown', function( $event, code ) {
        $scope.keys.forEach(function(o) {
          if ( o.code !== code ) { 
            return;
          }
          o.action($event);
          $scope.$apply();
        });
      });
    },
    link: function ($scope, $element, $attrs) {
      $element.bind('keydown', function( event ) {
        if (!$scope.listVisible) {
          return;
        }

        angular.forEach($scope.keys, function (key) {
          if (event.keyCode == key.code) {
            event.preventDefault();
            event.stopPropagation();
            $scope.$broadcast('keydown', event.keyCode);
            return;
          }
        });
      });


      $scope.$itemList = angular.element($element[0].querySelector('.' + CSS_CONSTANTS.container))[0];
      $scope.textElement = $element[0].children[1].children[0];
      $scope.$$nextSibling.$watch('input', function (newVal, oldVal) {
        if (typeof newVal == 'undefined') {
          return;
        }

        var cursorPos = getCursorPos($scope.textElement).start;
        var text = newVal.substring(0, cursorPos);
        var matches = text.match(REGEX);

        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
        $scope.focusIndex = false;


        if (!matches && $scope.matched) {
          $scope.matched = false;
          $scope.hideList();
          return;
        }

        if (matches && !$scope.matched) {
          $scope.matched = true;
          $scope.displayList();
        }

        if (matches) {
          // Filter List
          $scope.mention = matches[2];
          $scope.find = TOKEN + matches[2]
          $scope.cursorPos = cursorPos;
        }

      }, true);

      $scope.element = $element[0];

      $scope.reset();
    }
  };
});


function getCursorPos(input) {
  //http://stackoverflow.com/questions/7745867/how-do-you-get-the-cursor-position-in-a-textarea
  if (input.hasOwnProperty('selectionStart') && document.activeElement == input) {
    return {
      start: input.selectionStart,
      end: input.selectionEnd
    };
  } else if (input.createTextRange) {
    var sel = document.selection.createRange();
    if (sel.parentElement() === input) {
      var rng = input.createTextRange();
      rng.moveToBookmark(sel.getBookmark());
      for (var len = 0; rng.compareEndPoints("EndToStart", rng) > 0; rng.moveEnd("character", -1)) {
        len++;
      }
      rng.setEndPoint("StartToStart", input.createTextRange());
      for (var pos = { start: 0, end: len }; rng.compareEndPoints("EndToStart", rng) > 0; rng.moveEnd("character", -1)) {
        pos.start++;
        pos.end++;
      }
      return pos;
    }
  }
  return -1;
}


function setSelectionRange(input, selectionStart, selectionEnd) {
  //http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  } else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

function setCaretToPos (input, pos) {
  //http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
  setSelectionRange(input, pos, pos);
}