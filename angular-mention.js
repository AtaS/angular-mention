function getCursorPos (input) {
  //http://stackoverflow.com/questions/7745867/how-do-you-get-the-cursor-position-in-a-textarea
  if (input.hasOwnProperty('selectionStart') && document.activeElement === input) {
    return {
      start: input.selectionStart,
      end: input.selectionEnd
    };
  } else if (input.createTextRange) {
    var sel = document.selection.createRange();
    if (sel.parentElement() === input) {
      var rng = input.createTextRange();
      rng.moveToBookmark(sel.getBookmark());
      for (var len = 0; rng.compareEndPoints('EndToStart', rng) > 0; rng.moveEnd('character', -1)) {
        len++;
      }
      rng.setEndPoint('StartToStart', input.createTextRange());
      for (var pos = { start: 0, end: len }; rng.compareEndPoints('EndToStart', rng) > 0; rng.moveEnd('character', -1)) {
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

var at_mention = angular.module('angular-mention', []);

var TOKEN = '@';


at_mention.service('mention_input', function () {
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
  container: '-mention-list-container',
  list: '-mention-list',
  listItem: '-mention-list-item',
  selected: '-mention-selected'
};

var LIST_DATA = {
  token: 'nickname',
  longform: 'name',
  id: 'nid'
};

// var LIST_DATA = {
//   token: 'field_email',
//   longform: 'node_title',
//   id: 'nid'
// };


var LIST_ITEM_TEMPLATE = '<div><span>@{{v.' + LIST_DATA.token + '}}</span>&nbsp;<small>({{v.' + LIST_DATA.longform + '}})</small></div>';

var LIST_TEMPLATE = '<div><div class="' + CSS_CONSTANTS.container + '" style="display: none; position: absolute;"><ul class="' + CSS_CONSTANTS.list + '"><li ng-repeat="v in values | filter:mention" ng-click="choose(v)" ng-Mouseover="onhover($event)" class="' + CSS_CONSTANTS.listItem + '">' + LIST_ITEM_TEMPLATE + '</li></ul></div><div ng-transclude></div></div>';

at_mention.directive('atMention', function () {
  return {
    restrict: 'A',
    replace: true,
    transclude: true,
    template: LIST_TEMPLATE,//'<div><div class="-mention-list-container" style="display: none; position: absolute;"><ul class="-mention-list"><li ng-repeat="v in values | filter:mention track by v.nid" token="{{v.nickname}}" ng-click="choose(v)" ng-Mouseover="onhover($event)" class="-mention-list-item"><div><span>@{{v.nickname}}</span>&nbsp;<small>({{v.name}})</small></div></li></ul></div><div ng-transclude></div></div>',
    scope: {
      typeahead: '@',
      mentionModel: '@',
      mentionList: '@',
      mentionDataMap: '@'
    },
    controller: function ($scope, mention_input, $log, $http) {
      $scope.focusIndex = false;
      $scope.listVisible = false;

      if (typeof $scope.mentionList !== 'undefined') {
        $http.get($scope.mentionList).success(function(userlist){
          $scope.values = userlist;
        }).error(function () {
          $scope.values = mention_input.userlist;
        });
      } else {
        $scope.values = mention_input.userlist;
      }

      $scope.matched = false;


      // if (typeof $scope.mentionDataMap !== 'undefined') {
      //   LIST_DATA = $scope.mentionDataMap;
      // }

      var padSelection = function (selection) {
        if (selection.substr(-1) !== ' ') {
          return selection + ' ';
        }
      };

      var setText = function (element, newText) {
        element.value = newText;
      };

      $scope.getChoices = function () {
        return angular.element($scope.element).find('ul').find('li');
      };

      $scope.onhover = function (obj) {
        if (obj.hasOwnProperty('originalEvent')) {
          obj = obj.originalEvent;
        }
        //console.log('obj', obj);

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

      $scope.choose = function (v) {
        var regex = new RegExp('([^' + TOKEN + ']*)' + TOKEN + '[^$]*');
        var selection = v[LIST_DATA.token];
        if (selection.indexOf(TOKEN) >= 0) {
          selection = selection.replace(regex, '$1');
        }
        selection = padSelection(selection);

        var $textElement = $scope.textElement;
        var $textValue = $textElement.value;


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





      var eventHandlers = {};
      eventHandlers.tab = function ($event) {
        // $log.debug('[Event] KeyDown: tab');
        var lis = $scope.getChoices();
        angular.element(lis[$scope.focusIndex]).triggerHandler('click');
      };

      eventHandlers.enter = function ($event) {
        // $log.debug('[Event] KeyDown: return');
        var lis = $scope.getChoices();
        angular.element(lis[$scope.focusIndex]).triggerHandler('click');
      };

      eventHandlers.escape = function ($event) {
        // $log.debug('[Event] KeyDown: escape');
        $scope.hideList();
      };

      eventHandlers.upArrow = function ($event) {
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

      eventHandlers.downArrow = function ($event) {
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
      $scope.keys.push({ code: 9, action: eventHandlers.tab });
      $scope.keys.push({ code: 13, action: eventHandlers.enter });
      $scope.keys.push({ code: 27, action: eventHandlers.escape });
      $scope.keys.push({ code: 38, action: eventHandlers.upArrow });
      $scope.keys.push({ code: 40, action: eventHandlers.downArrow });
      $scope.$on('keydown', function( $event, code ) {
        angular.forEach($scope.keys, function(o) {
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
          if (event.keyCode === key.code) {
            event.preventDefault();
            event.stopPropagation();
            $scope.$broadcast('keydown', event.keyCode);
            return;
          }
        });
      });

      if (typeof $scope.mentionModel === 'undefined') {
        $scope.mentionModel = 'input';
      }

      $scope.$itemList = angular.element($element[0].querySelector('.' + CSS_CONSTANTS.container))[0];
      $scope.textElement = $element[0].children[1].children[0];
      $scope.$$nextSibling.$watch($scope.mentionModel, function (newVal, oldVal) {
        if (typeof newVal === 'undefined') {
          return;
        }

        var cursorPos = getCursorPos($scope.textElement).start;
        var text = newVal.substring(0, cursorPos);
        var regex = new RegExp('(^|\\b|\\s)' + TOKEN + '([\\w]*)$');
        var matches = text.match(regex);

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
          $scope.find = TOKEN + matches[2];
          $scope.cursorPos = cursorPos;
        }

      }, true);

      $scope.element = $element[0];

      $scope.reset();
    }
  };
});
